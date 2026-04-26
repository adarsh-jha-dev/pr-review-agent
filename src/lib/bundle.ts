export interface BundleResult {
  pkg: string;
  sizeGzip: number;
  sizeParsed: number;
  isNew: boolean;
}

export async function fetchBundleSizes(
  diff: string,
  changedFiles: { filename: string }[]
): Promise<BundleResult[]> {
  const pkgChanged = changedFiles.some(f => f.filename.endsWith("package.json"));
  if (!pkgChanged) return [];

  const addedPkgs = extractAddedPackages(diff);
  if (!addedPkgs.length) return [];

  const results = await Promise.allSettled(
    addedPkgs.map(async ({ name, isNew }) => {
      const res = await fetch(
        `https://bundlephobia.com/api/size?package=${encodeURIComponent(name)}`,
        { headers: { "User-Agent": "DiffWatch/1.0" } }
      );
      if (!res.ok) return null;
      const data = await res.json();
      return {
        pkg: name,
        sizeGzip: data.gzip ?? 0,
        sizeParsed: data.size ?? 0,
        isNew,
      } satisfies BundleResult;
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<BundleResult | null> => r.status === "fulfilled")
    .map(r => r.value)
    .filter((r): r is BundleResult => r !== null);
}

function extractAddedPackages(diff: string): { name: string; isNew: boolean }[] {
  const results: { name: string; isNew: boolean }[] = [];
  const lines = diff.split("\n");
  let inPkgJson = false;
  const removedPkgs = new Set<string>();

  for (const line of lines) {
    if (line.includes("package.json")) { inPkgJson = true; continue; }
    if (inPkgJson && line.startsWith("diff --git")) { inPkgJson = false; continue; }
    if (!inPkgJson) continue;

    const removed = line.match(/^-\s+"(@?[a-z][a-z0-9/_.-]*)"\s*:/);
    if (removed && !["name","version","description"].includes(removed[1])) {
      removedPkgs.add(removed[1]);
    }
  }

  // reset and collect added
  inPkgJson = false;
  for (const line of lines) {
    if (line.includes("package.json")) { inPkgJson = true; continue; }
    if (inPkgJson && line.startsWith("diff --git")) { inPkgJson = false; continue; }
    if (!inPkgJson) continue;

    const added = line.match(/^\+\s+"(@?[a-z][a-z0-9/_.-]*)"\s*:/);
    if (added && !["name","version","description","scripts","dependencies","devDependencies","peerDependencies"].includes(added[1])) {
      results.push({ name: added[1], isNew: !removedPkgs.has(added[1]) });
    }
  }

  const seen = new Set<string>();
  return results.filter(r => {
    if (seen.has(r.name)) return false;
    seen.add(r.name);
    return true;
  }).slice(0, 8);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}kb`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}mb`;
}
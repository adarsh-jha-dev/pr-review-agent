const GH = "https://api.github.com";
const headers = {
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  Accept: "application/vnd.github.v3+json",
};

export function parsePRUrl(url: string) {
  const m = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!m) throw new Error("Invalid GitHub PR URL — use https://github.com/owner/repo/pull/123");
  return { owner: m[1], repo: m[2], pull: Number(m[3]) };
}

async function gh(path: string, accept?: string) {
  const res = await fetch(`${GH}${path}`, {
    headers: accept ? { ...headers, Accept: accept } : headers,
  });
  if (!res.ok) throw new Error(`GitHub ${path} → ${res.status}`);
  return res;
}

export interface PRContext {
  // core
  title: string;
  description: string;
  author: string;
  authorAvatar: string;
  diff: string;
  changedFiles: FileStats[];
  baseBranch: string;
  headBranch: string;
  createdAt: string;
  // enrichment
  ciChecks: CICheck[];
  linkedIssue: LinkedIssue | null;
  similarPRs: SimilarPR[];
  contributorStats: ContributorStats;
  vulnerabilities: Vulnerability[];
}

export interface FileStats {
  filename: string;
  additions: number;
  deletions: number;
  changes: number;
  status: string;
}

export interface CICheck {
  name: string;
  status: "completed" | "in_progress" | "queued";
  conclusion: "success" | "failure" | "skipped" | "cancelled" | null;
  url: string;
}

export interface LinkedIssue {
  number: number;
  title: string;
  body: string;
  labels: string[];
}

export interface SimilarPR {
  number: number;
  title: string;
  state: string;
  url: string;
  mergedAt: string | null;
}

export interface ContributorStats {
  totalPRs: number;
  mergedPRs: number;
  firstContribution: boolean;
}

export interface Vulnerability {
  pkg: string;
  ecosystem: string;
  vulns: { id: string; summary: string; severity: string }[];
}

export interface ArchaeologyEntry {
  filename: string;
  commitCount: number;
  lastModified: string;
  uniqueAuthors: number;
  isHotspot: boolean;
}

export interface MergeConflictRisk {
  prNumber: number;
  prTitle: string;
  prUrl: string;
  sharedFiles: string[];
}

export async function fetchArchaeology(
  owner: string,
  repo: string,
  files: FileStats[]
): Promise<ArchaeologyEntry[]> {
  const topFiles = files.slice(0, 5);
  return Promise.all(
    topFiles.map(async (f) => {
      const commits = await gh(
        `/repos/${owner}/${repo}/commits?path=${encodeURIComponent(f.filename)}&per_page=30`
      )
        .then(r => r.json())
        .catch(() => []);
      const uniqueAuthors = new Set(
        (commits as any[]).map(c => c.commit?.author?.name).filter(Boolean)
      ).size;
      const lastModified: string = (commits as any[])[0]?.commit?.author?.date ?? "";
      return {
        filename: f.filename,
        commitCount: (commits as any[]).length,
        lastModified,
        uniqueAuthors,
        isHotspot: (commits as any[]).length >= 10,
      };
    })
  );
}

export async function fetchMergeConflictRisks(
  owner: string,
  repo: string,
  currentPRNumber: number,
  currentFiles: FileStats[]
): Promise<MergeConflictRisk[]> {
  const currentFilenames = new Set(currentFiles.map(f => f.filename));
  const openPRs = await gh(`/repos/${owner}/${repo}/pulls?state=open&per_page=15`)
    .then(r => r.json())
    .catch(() => []);

  const results: MergeConflictRisk[] = [];
  await Promise.all(
    (openPRs as any[])
      .filter(pr => pr.number !== currentPRNumber)
      .slice(0, 8)
      .map(async (pr) => {
        const prFiles = await gh(`/repos/${owner}/${repo}/pulls/${pr.number}/files`)
          .then(r => r.json())
          .catch(() => []);
        const sharedFiles = (prFiles as any[])
          .map(f => f.filename as string)
          .filter(fname => currentFilenames.has(fname));
        if (sharedFiles.length > 0) {
          results.push({
            prNumber: pr.number,
            prTitle: pr.title,
            prUrl: pr.html_url,
            sharedFiles,
          });
        }
      })
  );
  return results;
}

export async function fetchPRContext(
  owner: string,
  repo: string,
  pull: number
): Promise<PRContext> {
  // parallel fetch everything
  const [prRes, diffRes, filesRes] = await Promise.all([
    gh(`/repos/${owner}/${repo}/pulls/${pull}`),
    gh(`/repos/${owner}/${repo}/pulls/${pull}`, "application/vnd.github.v3.diff"),
    gh(`/repos/${owner}/${repo}/pulls/${pull}/files`),
  ]);

  const pr = await prRes.json();
  const diff = (await diffRes.text()).slice(0, 14000);
  const files: FileStats[] = (await filesRes.json()).map((f: any) => ({
    filename: f.filename,
    additions: f.additions,
    deletions: f.deletions,
    changes: f.changes,
    status: f.status,
  }));

  // fetch CI checks via commit SHA
  const sha = pr.head.sha;
  const checksData = await gh(`/repos/${owner}/${repo}/commits/${sha}/check-runs`)
    .then(r => r.json()).catch(() => ({ check_runs: [] }));
  const ciChecks: CICheck[] = (checksData.check_runs || []).map((c: any) => ({
    name: c.name,
    status: c.status,
    conclusion: c.conclusion,
    url: c.html_url,
  }));

  // linked issue from PR body
  let linkedIssue: LinkedIssue | null = null;
  const issueMatch = (pr.body ?? "").match(/(?:fixes|closes|resolves)\s+#(\d+)/i);
  if (issueMatch) {
    const issue = await gh(`/repos/${owner}/${repo}/issues/${issueMatch[1]}`)
      .then(r => r.json()).catch(() => null);
    if (issue) {
      linkedIssue = {
        number: issue.number,
        title: issue.title,
        body: (issue.body ?? "").slice(0, 1000),
        labels: issue.labels.map((l: any) => l.name),
      };
    }
  }

  // similar merged PRs touching the same files
  const topFile = files[0]?.filename ?? "";
  const searchRes = await fetch(
    `${GH}/search/issues?q=repo:${owner}/${repo}+is:pr+is:merged+${encodeURIComponent(topFile)}&per_page=5`,
    { headers }
  ).then(r => r.json()).catch(() => ({ items: [] }));
  const similarPRs: SimilarPR[] = (searchRes.items || [])
    .filter((i: any) => i.number !== pull)
    .slice(0, 4)
    .map((i: any) => ({
      number: i.number,
      title: i.title,
      state: i.state,
      url: i.html_url,
      mergedAt: i.pull_request?.merged_at ?? null,
    }));

  // contributor stats
  const authorPRs = await fetch(
    `${GH}/search/issues?q=repo:${owner}/${repo}+is:pr+author:${pr.user.login}&per_page=1`,
    { headers }
  ).then(r => r.json()).catch(() => ({ total_count: 0 }));
  const mergedPRs = await fetch(
    `${GH}/search/issues?q=repo:${owner}/${repo}+is:pr+is:merged+author:${pr.user.login}&per_page=1`,
    { headers }
  ).then(r => r.json()).catch(() => ({ total_count: 0 }));
  const contributorStats: ContributorStats = {
    totalPRs: authorPRs.total_count ?? 0,
    mergedPRs: mergedPRs.total_count ?? 0,
    firstContribution: (authorPRs.total_count ?? 0) <= 1,
  };

  // OSV vulnerability scan on new/modified package files
  const vulnerabilities = await scanVulnerabilities(files, owner, repo);

  return {
    title: pr.title,
    description: pr.body ?? "(no description)",
    author: pr.user.login,
    authorAvatar: pr.user.avatar_url,
    diff,
    changedFiles: files,
    baseBranch: pr.base.ref,
    headBranch: pr.head.ref,
    createdAt: pr.created_at,
    ciChecks,
    linkedIssue,
    similarPRs,
    contributorStats,
    vulnerabilities,
  };
}

async function scanVulnerabilities(
  files: FileStats[],
  owner: string,
  repo: string
): Promise<Vulnerability[]> {
  // only scan if package files changed
  const pkgFile = files.find(f =>
    ["package.json", "requirements.txt", "go.mod", "Cargo.toml"].some(n =>
      f.filename.endsWith(n)
    )
  );
  if (!pkgFile) return [];

  // fetch the actual file content to get package names
  const content = await fetch(
    `${GH}/repos/${owner}/${repo}/contents/${pkgFile.filename}`,
    { headers }
  ).then(r => r.json()).catch(() => null);

  if (!content?.content) return [];

  let packages: { name: string; ecosystem: string }[] = [];
  const raw = Buffer.from(content.content, "base64").toString("utf-8");

  if (pkgFile.filename.endsWith("package.json")) {
    try {
      const pkg = JSON.parse(raw);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      packages = Object.keys(deps).slice(0, 10).map(name => ({
        name,
        ecosystem: "npm",
      }));
    } catch {}
  } else if (pkgFile.filename.endsWith("requirements.txt")) {
    packages = raw
      .split("\n")
      .filter(l => l.trim() && !l.startsWith("#"))
      .slice(0, 10)
      .map(l => ({ name: l.split(/[>=<!=]/)[0].trim(), ecosystem: "PyPI" }));
  }

  // batch query OSV.dev
  const results: Vulnerability[] = [];
  await Promise.all(
    packages.map(async ({ name, ecosystem }) => {
      const res = await fetch("https://api.osv.dev/v1/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package: { name, ecosystem } }),
      }).then(r => r.json()).catch(() => ({ vulns: [] }));

      if (res.vulns?.length) {
        results.push({
          pkg: name,
          ecosystem,
          vulns: res.vulns.slice(0, 3).map((v: any) => ({
            id: v.id,
            summary: v.summary ?? "No summary",
            severity: v.database_specific?.severity ?? "UNKNOWN",
          })),
        });
      }
    })
  );

  return results;
}
import { PRContext } from "@/types/review";

const GH_BASE = "https://api.github.com";
const headers = {
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  Accept: "application/vnd.github.v3+json",
};

export function parsePRUrl(url: string) {
  // handles both full URL and "owner/repo/pull/123" shorthand
  const match = url.match(
    /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)|^([^/]+)\/([^/]+)\/(\d+)$/
  );
  if (!match) throw new Error("Invalid GitHub PR URL");
  const owner = match[1] ?? match[4];
  const repo = match[2] ?? match[5];
  const pull = match[3] ?? match[6];
  return { owner, repo, pull: Number(pull) };
}

export async function fetchPRContext(
  owner: string,
  repo: string,
  pull: number
): Promise<PRContext> {
  const [prRes, diffRes, filesRes] = await Promise.all([
    fetch(`${GH_BASE}/repos/${owner}/${repo}/pulls/${pull}`, { headers }),
    fetch(`${GH_BASE}/repos/${owner}/${repo}/pulls/${pull}`, {
      headers: { ...headers, Accept: "application/vnd.github.v3.diff" },
    }),
    fetch(`${GH_BASE}/repos/${owner}/${repo}/pulls/${pull}/files`, { headers }),
  ]);

  if (!prRes.ok) throw new Error(`GitHub API error: ${prRes.status}`);

  const pr = await prRes.json();
  const diff = await diffRes.text();
  const files = await filesRes.json();

  return {
    title: pr.title,
    description: pr.body ?? "(no description)",
    author: pr.user.login,
    diff: diff.slice(0, 12000), // stay within token budget
    changedFiles: files.map((f: { filename: string }) => f.filename),
  };
}
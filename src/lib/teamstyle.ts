const GH = "https://api.github.com";
const headers = {
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  Accept: "application/vnd.github.v3+json",
};

export interface TeamStyle {
  exampleComments: string[];
  toneDescription: string;
  topConcerns: string[];
}

export async function fetchTeamStyle(
  owner: string,
  repo: string
): Promise<TeamStyle> {
  const res = await fetch(
    `${GH}/repos/${owner}/${repo}/pulls/comments?per_page=50&sort=created&direction=desc`,
    { headers }
  ).catch(() => null);

  if (!res?.ok) return { exampleComments: [], toneDescription: "professional", topConcerns: [] };

  const comments: any[] = await res.json().catch(() => []);

  const humanComments = comments
    .filter(c =>
      !c.user?.login?.includes("bot") &&
      !c.user?.login?.includes("[bot]") &&
      (c.body?.length ?? 0) > 20 &&
      (c.body?.length ?? 0) < 500
    )
    .slice(0, 20)
    .map(c => c.body.trim());

  if (humanComments.length === 0) {
    return { exampleComments: [], toneDescription: "professional", topConcerns: [] };
  }

  const allText = humanComments.join(" ").toLowerCase();
  return {
    exampleComments: humanComments.slice(0, 8),
    toneDescription: deriveTone(allText),
    topConcerns: deriveTopConcerns(allText),
  };
}

function deriveTone(text: string): string {
  const formal  = (text.match(/\b(please|should|must|consider|ensure|recommend)\b/g) ?? []).length;
  const casual  = (text.match(/\b(nit|nice|cool|lgtm|awesome|great|love)\b/g) ?? []).length;
  const harsh   = (text.match(/\b(wrong|bad|broken|terrible|never|always avoid)\b/g) ?? []).length;
  if (harsh > 3)      return "direct and critical — reviewers call issues out bluntly";
  if (formal > casual) return "formal and structured — comments are professional and detailed";
  if (casual > formal) return "casual and friendly — team uses informal language and encouragement";
  return "balanced — mix of direct feedback and positive reinforcement";
}

function deriveTopConcerns(text: string): string[] {
  const concerns = [
    { label: "test coverage",      keywords: ["test","spec","coverage","jest","vitest"] },
    { label: "performance",        keywords: ["performance","slow","optimize","memo","cache"] },
    { label: "type safety",        keywords: ["type","typescript","any","interface","generic"] },
    { label: "error handling",     keywords: ["error","catch","try","throw","exception"] },
    { label: "naming conventions", keywords: ["name","rename","variable","naming","consistent"] },
    { label: "documentation",      keywords: ["comment","jsdoc","doc","readme","explain"] },
    { label: "security",           keywords: ["security","sanitize","escape","xss","injection"] },
    { label: "code duplication",   keywords: ["duplicate","reuse","dry","abstract","shared"] },
  ];
  return concerns
    .map(c => ({
      label: c.label,
      count: c.keywords.reduce((n, kw) =>
        n + (text.match(new RegExp(`\\b${kw}`, "g")) ?? []).length, 0),
    }))
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)
    .map(c => c.label);
}
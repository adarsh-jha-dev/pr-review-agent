import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { parsePRUrl } from "@/lib/github";

const PERSONAS = {
  architect: {
    name: "The Architect",
    system: "You are a senior software architect with 15 years of experience. Focus exclusively on coupling, cohesion, abstraction leakage, and long-term maintainability. Be direct and opinionated. Point out structural issues most reviewers miss. Max 180 words.",
  },
  security: {
    name: "The Security Lead",
    system: "You are a paranoid security engineer. Hunt for injection vulnerabilities, broken auth, secrets in code, insecure defaults, OWASP Top 10, data exposure, and unsafe dependencies. Assume adversarial input. Max 180 words.",
  },
  pm: {
    name: "The PM",
    system: "You are a product manager with no coding background. Explain in plain English: what does this PR do, is it safe to ship right now, what could break for users, and does it solve the actual problem? No technical jargon. Max 180 words.",
  },
  intern: {
    name: "The Intern",
    system: "You are an enthusiastic junior developer reviewing this PR to learn. Ask 3 genuine, curious questions about the architectural or coding choices, then share one thing you found impressive or surprising. Friendly and inquisitive tone. Max 180 words.",
  },
} as const;

export async function POST(req: Request) {
  const { prUrl, persona } = await req.json();
  const cfg = PERSONAS[persona as keyof typeof PERSONAS];
  if (!cfg) return new Response("Invalid persona", { status: 400 });

  const { owner, repo, pull } = parsePRUrl(prUrl);

  const [prRes, diffRes] = await Promise.all([
    fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pull}`, {
      headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json" },
    }),
    fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pull}`, {
      headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: "application/vnd.github.v3.diff" },
    }),
  ]);

  const pr = await prRes.json();
  const diff = (await diffRes.text()).slice(0, 8000);

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: cfg.system,
    prompt: `PR: "${pr.title}" by @${pr.user?.login ?? "unknown"}

Description: ${(pr.body ?? "(none)").slice(0, 600)}

Diff:
\`\`\`diff
${diff}
\`\`\`

Respond as ${cfg.name}.`,
    maxOutputTokens: 512,
  });

  return result.toTextStreamResponse();
}

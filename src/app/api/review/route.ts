import { google } from "@ai-sdk/google";
import { streamObject } from "ai";
import { parsePRUrl, fetchPRContext } from "@/lib/github";
import { reviewSchema } from "@/lib/schemas";

export async function POST(req: Request) {
  const { prUrl } = await req.json();

  const { owner, repo, pull } = parsePRUrl(prUrl);
  const context = await fetchPRContext(owner, repo, pull);

  const prompt = `
You are a senior software engineer doing a thorough code review.

PR: "${context.title}" by @${context.author}
Description: ${context.description}

Changed files: ${context.changedFiles.join(", ")}

Diff:
\`\`\`diff
${context.diff}
\`\`\`

Review this PR. Be specific — reference actual line numbers and file names.
Flag real issues: bugs, security problems, missing error handling, performance concerns.
Also acknowledge what was done well.
`.trim();

  const result = streamObject({
    model: google("gemini-2.5-flash"),
    schema: reviewSchema,
    prompt,
  });

  return result.toTextStreamResponse();
}
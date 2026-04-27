import { google } from "@ai-sdk/google";
import { streamText } from "ai";

export async function POST(req: Request) {
  const { prUrl, title, summary, verdict, criticalCount, warningCount, positives } = await req.json();

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: "You write concise, human-readable deployment announcements for engineering Slack channels. Be direct. No fluff. Use bullet points sparingly. No emojis unless critical context. Max 200 words.",
    prompt: `Write a Slack-ready ship announcement for this PR.

PR URL: ${prUrl}
Title: ${title ?? "(unknown)"}
Review verdict: ${verdict}
Critical issues: ${criticalCount ?? 0}
Warnings: ${warningCount ?? 0}
Positives: ${(positives ?? []).join(", ") || "none noted"}

AI review summary:
${summary ?? "(no summary)"}

Format:
1. One bold headline sentence (what shipped)
2. 2-3 bullet points: key changes, any risks to watch, what was verified
3. One-line footer: "Reviewed by DiffWatch · ${prUrl}"

Keep it under 180 words. Write for a senior eng audience.`,
    maxOutputTokens: 300,
  });

  return result.toTextStreamResponse();
}

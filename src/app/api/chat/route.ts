import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { parsePRUrl, fetchPRContext } from "@/lib/github";

export async function POST(req: Request) {
  const { messages, prUrl, review } = await req.json();

  const { owner, repo, pull } = parsePRUrl(prUrl);
  const ctx = await fetchPRContext(owner, repo, pull).catch(() => null);

  const systemPrompt = `
You are DiffWatch, an AI code review assistant. You reviewed this pull request and are answering follow-up questions from the developer.

## Pull request
Title: "${ctx?.title ?? "Unknown"}"
Author: @${ctx?.author ?? "Unknown"}
Branch: ${ctx?.headBranch ?? "?"} → ${ctx?.baseBranch ?? "?"}

## Your review verdict
${review?.verdict ?? "Unknown"}

## Your review summary
${review?.summary ?? "No summary available."}

## Comments you raised
${(review?.comments ?? []).map((c: { severity: string; file: string; line?: number | null; message: string }) =>
  `- [${c.severity.toUpperCase()}] ${c.file}${c.line ? `:${c.line}` : ""} — ${c.message}`
).join("\n") || "None"}

## What was good
${(review?.positives ?? []).map((p: string) => `- ${p}`).join("\n") || "None noted"}

## Full diff
\`\`\`diff
${ctx?.diff ?? "Diff unavailable"}
\`\`\`

Rules:
- Answer concisely — this is a chat, not an essay
- Reference exact file names and line numbers when relevant
- If asked to suggest a fix, provide a concrete code snippet
- If asked whether to merge, give a direct recommendation based on your review
- Stay focused on this specific PR
`.trim();

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: systemPrompt,
    messages: messages.map((m: { role: "user" | "assistant"; content: string }) => ({
      role: m.role,
      content: m.content,
    })),
    maxOutputTokens: 1024,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const text of result.textStream) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
          );
        }
      } catch {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ text: "\n\n[Error generating response]" })}\n\n`)
        );
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

import { google } from "@ai-sdk/google";
import { streamText } from "ai";

export async function POST(req: Request) {
  const { file, line, severity, message } = await req.json();

  const result = streamText({
    model: google("gemini-2.5-flash"),
    prompt: `You are a code fix assistant. A code review flagged this issue:

File: ${file}${line != null ? `:${line}` : ""}
Severity: ${severity}
Issue: ${message}

Provide a concrete, minimal fix. Show the corrected code in a markdown code block with the right language tag. Add one short sentence explaining the fix. Do not repeat the issue description.`.trim(),
    maxOutputTokens: 1024,
  });

  return result.toTextStreamResponse();
}

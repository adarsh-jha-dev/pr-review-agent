import { google } from "@ai-sdk/google";
import { streamObject } from "ai";
import { coreReviewSchema } from "@/lib/schemas";
import { parsePRUrl, fetchPRContext } from "@/lib/github";

export async function POST(req: Request) {
  const { prUrl } = await req.json();
  const { owner, repo, pull } = parsePRUrl(prUrl);
  const ctx = await fetchPRContext(owner, repo, pull);

  const ciSummary = ctx.ciChecks.length
    ? ctx.ciChecks.map(c => `  - ${c.name}: ${c.conclusion ?? c.status}`).join("\n")
    : "  No CI checks found";

  const vulnSummary = ctx.vulnerabilities.length
    ? ctx.vulnerabilities.map(v =>
        `  - ${v.pkg} (${v.ecosystem}): ${v.vulns.map(x => x.id).join(", ")}`
      ).join("\n")
    : "  No known vulnerabilities found";

  const similarSummary = ctx.similarPRs.length
    ? ctx.similarPRs.map(p => `  - #${p.number}: ${p.title}`).join("\n")
    : "  None found";

  const linkedIssueSummary = ctx.linkedIssue
    ? `Issue #${ctx.linkedIssue.number}: ${ctx.linkedIssue.title}\n${ctx.linkedIssue.body}`
    : "None";

  const prompt = `
You are a senior software engineer performing a thorough, opinionated code review.

## PR info
Title: "${ctx.title}"
Author: @${ctx.author} (${ctx.contributorStats.firstContribution ? "FIRST-TIME contributor — be welcoming" : `${ctx.contributorStats.mergedPRs} merged PRs in this repo`})
Branch: ${ctx.headBranch} → ${ctx.baseBranch}

## Description
${ctx.description}

## CI checks
${ciSummary}

## Linked issue
${linkedIssueSummary}

## Dependency vulnerabilities
${vulnSummary}

## Similar merged PRs (same files)
${similarSummary}

## Changed files (${ctx.changedFiles.length} total)
${ctx.changedFiles.map(f => `  ${f.filename} (+${f.additions}/-${f.deletions})`).join("\n")}

## Diff
\`\`\`diff
${ctx.diff}
\`\`\`

Instructions:
- If CI is failing, mention it prominently in your summary
- If vulnerabilities were found, flag the affected packages as critical issues
- If a linked issue exists, verify the fix actually addresses it
- Reference similar PRs if they're relevant context
- Be specific — include exact file names and line numbers
- Be welcoming if this is a first-time contributor
`.trim();

  const result = streamObject({
    model: google("gemini-2.5-flash"),
    schema: coreReviewSchema,
    prompt,
  });

  // Prepend the static context fields to the AI-generated JSON stream.
  // useObject accumulates raw text and calls parsePartialJson, so we inject
  // changedFiles/ciChecks/vulnerabilities as the opening keys of the merged object,
  // then stream the AI-generated fields (summary/verdict/comments/positives) after.
  const staticPrefix =
    JSON.stringify({
      changedFiles: ctx.changedFiles,
      ciChecks: ctx.ciChecks,
      vulnerabilities: ctx.vulnerabilities,
    }).slice(0, -1) + ","; // strip trailing } and add comma

  const encoder = new TextEncoder();
  let openBraceSkipped = false;
  let buffer = "";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode(staticPrefix));
      for await (const chunk of result.textStream) {
        if (!openBraceSkipped) {
          buffer += chunk;
          const idx = buffer.indexOf("{");
          if (idx !== -1) {
            openBraceSkipped = true;
            const rest = buffer.slice(idx + 1);
            if (rest) controller.enqueue(encoder.encode(rest));
            buffer = "";
          }
        } else {
          controller.enqueue(encoder.encode(chunk));
        }
      }
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

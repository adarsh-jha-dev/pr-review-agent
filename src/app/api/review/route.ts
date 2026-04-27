import { google } from "@ai-sdk/google";
import { streamObject } from "ai";
import { coreReviewSchema } from "@/lib/schemas";
import { parsePRUrl, fetchPRContext, fetchArchaeology, fetchMergeConflictRisks } from "@/lib/github";
import { fetchBundleSizes, formatBytes } from "@/lib/bundle";
import { fetchTeamStyle } from "@/lib/teamstyle";
import { supabase } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";

interface TimeBomb { file: string; line: number | null; type: string; content: string; }

function detectTimeBombs(diff: string): TimeBomb[] {
  const bombs: TimeBomb[] = [];
  const patterns = [
    { type: "todo",          regex: /\b(TODO|FIXME|HACK|XXX|BUG)\b/ },
    { type: "console",       regex: /console\.(log|error|warn|debug|info)\s*\(/ },
    { type: "ts-ignore",     regex: /@ts-ignore|@ts-nocheck/ },
    { type: "eslint-disable",regex: /eslint-disable/ },
    { type: "hardcoded-date",regex: /new Date\(["']|["']\d{4}-\d{2}-\d{2}["']/ },
    { type: "deprecated",    regex: /\bdeprecated\b/i },
  ];
  let currentFile = "";
  let lineNum = 0;
  for (const raw of diff.split("\n")) {
    if (raw.startsWith("diff --git")) {
      const m = raw.match(/b\/(.+)$/); currentFile = m ? m[1] : ""; lineNum = 0;
    } else if (raw.startsWith("@@")) {
      const m = raw.match(/\+(\d+)/); lineNum = m ? parseInt(m[1]) - 1 : lineNum;
    } else if (raw.startsWith("+") && !raw.startsWith("+++")) {
      lineNum++;
      const content = raw.slice(1).trim();
      for (const { type, regex } of patterns) {
        if (regex.test(content)) { bombs.push({ file: currentFile, line: lineNum, type, content: content.slice(0, 120) }); break; }
      }
    } else if (!raw.startsWith("-")) {
      lineNum++;
    }
  }
  return bombs.slice(0, 25);
}

export async function POST(req: Request) {
  const { prUrl } = await req.json();
  const { owner, repo, pull } = parsePRUrl(prUrl);

  // fetch custom rules for this user (best-effort)
  let customRules = "";
  try {
    const auth = await createClient();
    const { data: { user } } = await auth.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("user_settings")
        .select("custom_rules")
        .eq("user_id", user.id)
        .single();
      customRules = data?.custom_rules ?? "";
    }
  } catch {}


  const [ctx, teamStyle] = await Promise.all([
    fetchPRContext(owner, repo, pull),
    fetchTeamStyle(owner, repo),
  ]);

  const [bundleImpact, archaeology, mergeConflictRisks] = await Promise.all([
    fetchBundleSizes(ctx.diff, ctx.changedFiles),
    fetchArchaeology(owner, repo, ctx.changedFiles),
    fetchMergeConflictRisks(owner, repo, pull, ctx.changedFiles),
  ]);

  const timeBombs = detectTimeBombs(ctx.diff);

  const styleBlock = teamStyle.exampleComments.length > 0 ? `
## This team's review style
Tone: ${teamStyle.toneDescription}
Top concerns: ${teamStyle.topConcerns.join(", ") || "general code quality"}

Real review comments from this repo (mirror this style exactly):
${teamStyle.exampleComments.map((c, i) => `${i + 1}. "${c}"`).join("\n")}

Write your comments in the same tone and voice as the examples above.
` : "";

  const bundleBlock = bundleImpact.length > 0 ? `
## Bundle size impact
${bundleImpact.map(b =>
  `  - ${b.pkg}: ${formatBytes(b.sizeGzip)} gzipped${b.isNew ? " (NEW)" : " (updated)"}`
).join("\n")}
Flag any package over 50kb gzipped as a warning.
` : "";

  const ciSummary = ctx.ciChecks.length
    ? ctx.ciChecks.map(c => `  - ${c.name}: ${c.conclusion ?? c.status}`).join("\n")
    : "  No CI checks found";

  const vulnSummary = ctx.vulnerabilities.length
    ? ctx.vulnerabilities.map(v =>
        `  - ${v.pkg} (${v.ecosystem}): ${v.vulns.map(x => x.id).join(", ")}`
      ).join("\n")
    : "  No known vulnerabilities found";

  const prompt = `
You are a senior software engineer performing a thorough, opinionated code review.
${styleBlock}
## PR info
Title: "${ctx.title}"
Author: @${ctx.author} (${ctx.contributorStats.firstContribution
    ? "FIRST-TIME contributor — be welcoming"
    : `${ctx.contributorStats.mergedPRs} merged PRs in this repo`})
Branch: ${ctx.headBranch} → ${ctx.baseBranch}

## Description
${ctx.description}

## CI checks
${ciSummary}

## Linked issue
${ctx.linkedIssue
    ? `Issue #${ctx.linkedIssue.number}: ${ctx.linkedIssue.title}\n${ctx.linkedIssue.body}`
    : "None"}

## Dependency vulnerabilities
${vulnSummary}
${bundleBlock}
## Similar merged PRs (same files)
${ctx.similarPRs.map(p => `  - #${p.number}: ${p.title}`).join("\n") || "  None found"}

## Changed files (${ctx.changedFiles.length} total)
${ctx.changedFiles.map(f => `  ${f.filename} (+${f.additions}/-${f.deletions})`).join("\n")}

## Diff
\`\`\`diff
${ctx.diff}
\`\`\`
${customRules ? `\n## Custom rules (enforce these strictly)\n${customRules}\n` : ""}
Instructions:
- Lead with CI failures in your summary if any checks are failing
- Mark vulnerable packages as critical issues
- Verify the linked issue is actually fixed if one exists
- Reference exact file names and line numbers
- Be welcoming if this is a first-time contributor
`.trim();

  const result = streamObject({
    model: google("gemini-2.5-flash"),
    schema: coreReviewSchema,
    prompt,
  });

  // inject static context + bundle data as prefix before AI stream
  const staticData = {
    changedFiles: ctx.changedFiles,
    ciChecks: ctx.ciChecks,
    vulnerabilities: ctx.vulnerabilities,
    bundleImpact,
    teamStyleConcerns: teamStyle.topConcerns,
    mergeConflictRisks,
    archaeology,
    timeBombs,
  };
  const staticPrefix = JSON.stringify(staticData).slice(0, -1) + ",";

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
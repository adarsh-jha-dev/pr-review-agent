import type { PRReview } from "@/lib/schemas";

const EMOJI = { approve: "✅", request_changes: "❌", needs_info: "❓" };
const LABEL = { approve: "Approved", request_changes: "Changes requested", needs_info: "Needs info" };

export async function notifySlack(webhookUrl: string, review: PRReview, prUrl: string) {
  const critical = review.comments.filter(c => c.severity === "critical").length;
  const warnings = review.comments.filter(c => c.severity === "warning").length;

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${EMOJI[review.verdict]} *PR Review — ${LABEL[review.verdict]}*\n<${prUrl}|View PR>`,
          },
        },
        {
          type: "section",
          text: { type: "mrkdwn", text: `> ${review.summary}` },
        },
        {
          type: "context",
          elements: [
            { type: "mrkdwn", text: `🔴 ${critical} critical  ⚠️ ${warnings} warnings  📝 ${review.comments.length} total comments` },
          ],
        },
      ],
    }),
  });
}

export async function notifyDiscord(webhookUrl: string, review: PRReview, prUrl: string) {
  const critical = review.comments.filter(c => c.severity === "critical").length;

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [{
        title: `${EMOJI[review.verdict]} PR Review — ${LABEL[review.verdict]}`,
        description: review.summary,
        url: prUrl,
        color: review.verdict === "approve" ? 0x3B6D11 : review.verdict === "request_changes" ? 0xA32D2D : 0x854F0B,
        fields: [
          { name: "Critical", value: String(critical), inline: true },
          { name: "Total comments", value: String(review.comments.length), inline: true },
        ],
      }],
    }),
  });
}
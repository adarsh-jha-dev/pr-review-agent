export async function POST(req: Request) {
  const { owner, repo, pull, review } = await req.json();

  const comments = (review.comments ?? [])
    .filter((c: any) => c.line && c.file)
    .map((c: any) => ({
      path: c.file,
      line: c.line,
      body: `**[${c.severity.toUpperCase()}]** ${c.message}`,
    }));

  const eventMap: Record<string, string> = {
    approve: "APPROVE",
    request_changes: "REQUEST_CHANGES",
    needs_info: "COMMENT",
  };

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${pull}/reviews`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        body: `## AI Review\n\n${review.summary}\n\n**Verdict:** ${review.verdict}`,
        event: eventMap[review.verdict] ?? "COMMENT",
        comments,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    return Response.json({ error: err.message }, { status: res.status });
  }

  const data = await res.json();
  return Response.json({ url: data.html_url });
}
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";

async function getUser() {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  return user;
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("user_id", user.id)
    .order("reviewed_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    (data ?? []).map((row) => ({
      id: row.id,
      prUrl: row.pr_url,
      repo: row.repo,
      prNumber: row.pr_number,
      review: row.review,
      reviewedAt: row.reviewed_at,
    }))
  );
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { prUrl, repo, prNumber, review, reviewedAt } = await req.json();

  const { data, error } = await supabase
    .from("reviews")
    .upsert(
      { user_id: user.id, pr_url: prUrl, repo, pr_number: prNumber, review, reviewed_at: reviewedAt },
      { onConflict: "user_id,pr_url" }
    )
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}

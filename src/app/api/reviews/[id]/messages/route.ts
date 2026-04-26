import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";

async function getUser() {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  return user;
}

async function verifyOwnership(reviewId: string, userId: string) {
  const { data } = await supabase
    .from("reviews")
    .select("id")
    .eq("id", reviewId)
    .eq("user_id", userId)
    .single();
  return !!data;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!await verifyOwnership(id, user.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("review_id", id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!await verifyOwnership(id, user.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { role, content } = await req.json();

  const { error } = await supabase
    .from("chat_messages")
    .insert({ review_id: id, role, content });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

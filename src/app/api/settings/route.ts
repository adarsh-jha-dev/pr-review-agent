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
  if (!user) return NextResponse.json({}, { status: 401 });

  const { data } = await supabase
    .from("user_settings")
    .select("slack_webhook, discord_webhook, custom_rules")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json(data ?? {});
}

export async function PUT(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({}, { status: 401 });

  const body = await req.json();

  const { error } = await supabase
    .from("user_settings")
    .upsert(
      { user_id: user.id, ...body, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

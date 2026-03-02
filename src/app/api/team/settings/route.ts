import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getUser, isSupabaseConfigured } from "@/lib/auth";
import { MOCK_TEAM } from "@/lib/team-seed-data";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ team: MOCK_TEAM });
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id, role")
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Not a team member" }, { status: 403 });
  }

  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("id", membership.team_id)
    .single();

  const response = NextResponse.json({ team });
  response.headers.set("Cache-Control", "private, max-age=120, stale-while-revalidate=600");
  return response;
}

export async function PATCH(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ team: { ...MOCK_TEAM, ...body } });
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id, role")
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "owner") {
    return NextResponse.json({ error: "Owner access required" }, { status: 403 });
  }

  const updates: Record<string, unknown> = {};
  if (body.name) updates.name = body.name;
  if (body.slug) updates.slug = body.slug;

  const { data: team, error } = await supabase
    .from("teams")
    .update(updates)
    .eq("id", membership.team_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidateTag("team-settings", { expire: 0 });

  return NextResponse.json({ team });
}

export async function DELETE() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true });
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id, role")
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "owner") {
    return NextResponse.json({ error: "Owner access required" }, { status: 403 });
  }

  const { error } = await supabase
    .from("teams")
    .delete()
    .eq("id", membership.team_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateTag("team-stats", { expire: 0 });
  revalidateTag("team-members", { expire: 0 });
  revalidateTag("team-settings", { expire: 0 });
  revalidateTag("team-invites", { expire: 0 });

  return NextResponse.json({ success: true });
}

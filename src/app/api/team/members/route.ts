import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getUser, isSupabaseConfigured } from "@/lib/auth";
import { MOCK_TEAM_MEMBERS } from "@/lib/team-seed-data";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ members: MOCK_TEAM_MEMBERS });
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Not a team member" }, { status: 403 });
  }

  const { data: members } = await supabase
    .from("team_members")
    .select("*")
    .eq("team_id", membership.team_id)
    .order("joined_at", { ascending: true });

  const response = NextResponse.json({ members: members ?? [] });
  response.headers.set("Cache-Control", "private, max-age=60, stale-while-revalidate=300");
  return response;
}

export async function DELETE(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { member_id } = body;

  if (!member_id) {
    return NextResponse.json({ error: "member_id is required" }, { status: 400 });
  }

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

  await supabase
    .from("team_members")
    .delete()
    .eq("id", member_id)
    .eq("team_id", membership.team_id);

  revalidateTag("team-members", { expire: 0 });
  revalidateTag("team-stats", { expire: 0 });

  return NextResponse.json({ success: true });
}

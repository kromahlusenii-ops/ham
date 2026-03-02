import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getUser, isSupabaseConfigured } from "@/lib/auth";
import { MOCK_TEAM_INVITES } from "@/lib/team-seed-data";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ invites: MOCK_TEAM_INVITES });
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

  const { data: invites } = await supabase
    .from("team_invites")
    .select("*")
    .eq("team_id", membership.team_id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const response = NextResponse.json({ invites: invites ?? [] });
  response.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=120");
  return response;
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { github_username } = body;

  if (!github_username) {
    return NextResponse.json({ error: "GitHub username is required" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      invite: {
        id: `inv-${Date.now()}`,
        team_id: "team-001",
        github_username,
        invited_by: user.id,
        status: "pending",
        created_at: new Date().toISOString(),
      },
    });
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

  const { data: invite, error } = await supabase
    .from("team_invites")
    .insert({
      team_id: membership.team_id,
      github_username,
      invited_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidateTag("team-invites", { expire: 0 });

  return NextResponse.json({ invite });
}

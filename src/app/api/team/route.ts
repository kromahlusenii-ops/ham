import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getUser, isSupabaseConfigured } from "@/lib/auth";
import { MOCK_TEAM, MOCK_TEAM_MEMBERS } from "@/lib/team-seed-data";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ team: MOCK_TEAM, membership: MOCK_TEAM_MEMBERS[0] });
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("team_members")
    .select("*, teams(*)")
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ team: null, membership: null });
  }

  const response = NextResponse.json({ team: membership.teams, membership });
  response.headers.set("Cache-Control", "private, max-age=60, stale-while-revalidate=300");
  return response;
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, slug } = body;

  if (!name || !slug) {
    return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ team: { ...MOCK_TEAM, name, slug }, membership: MOCK_TEAM_MEMBERS[0] });
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .insert({ name, slug, owner_id: user.id })
    .select()
    .single();

  if (teamError) {
    return NextResponse.json({ error: teamError.message }, { status: 400 });
  }

  const githubUsername = (user.user_metadata?.user_name as string) ?? "unknown";
  const githubAvatarUrl = (user.user_metadata?.avatar_url as string) ?? null;

  const { data: membership } = await supabase
    .from("team_members")
    .insert({
      team_id: team.id,
      user_id: user.id,
      github_username: githubUsername,
      github_avatar_url: githubAvatarUrl,
      display_name: (user.user_metadata?.full_name as string) ?? githubUsername,
      role: "owner",
    })
    .select()
    .single();

  revalidateTag("team-members", { expire: 0 });
  revalidateTag("team-settings", { expire: 0 });

  return NextResponse.json({ team, membership });
}

import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getUser, isSupabaseConfigured } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { action } = body;

  if (!action || !["accept", "decline"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true, action });
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data: invite } = await supabase
    .from("team_invites")
    .select("*")
    .eq("id", id)
    .single();

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  // Update invite status
  await supabase
    .from("team_invites")
    .update({ status: action === "accept" ? "accepted" : "declined" })
    .eq("id", id);

  // Create team member on accept
  if (action === "accept") {
    const githubUsername = (user.user_metadata?.user_name as string) ?? invite.github_username;
    const githubAvatarUrl = (user.user_metadata?.avatar_url as string) ?? null;

    await supabase.from("team_members").insert({
      team_id: invite.team_id,
      user_id: user.id,
      github_username: githubUsername,
      github_avatar_url: githubAvatarUrl,
      display_name: (user.user_metadata?.full_name as string) ?? githubUsername,
      role: "member",
    });
  }

  revalidateTag("team-invites", { expire: 0 });
  revalidateTag("team-members", { expire: 0 });

  return NextResponse.json({ success: true, action });
}

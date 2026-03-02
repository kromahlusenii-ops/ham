import { redirect } from "next/navigation";
import { getUser, isSupabaseConfigured } from "@/lib/auth";
import { MOCK_TEAM, MOCK_TEAM_MEMBERS } from "@/lib/team-seed-data";
import TeamDashboard from "@/components/team/TeamDashboard";

export default async function TeamPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  let team;
  let members;
  let isOwner = false;

  if (!isSupabaseConfigured()) {
    team = MOCK_TEAM;
    members = MOCK_TEAM_MEMBERS;
    isOwner = true;
  } else {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data: membership } = await supabase
      .from("team_members")
      .select("team_id, role")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      redirect("/dashboard/team/create");
    }

    // Fetch team and members in parallel (both only need team_id)
    const [{ data: teamData }, { data: membersData }] = await Promise.all([
      supabase.from("teams").select("*").eq("id", membership.team_id).single(),
      supabase.from("team_members").select("*").eq("team_id", membership.team_id),
    ]);

    team = teamData;
    members = membersData ?? [];
    isOwner = membership.role === "owner";
  }

  if (!team) redirect("/dashboard/team/create");

  return <TeamDashboard team={team} members={members} isOwner={isOwner} />;
}

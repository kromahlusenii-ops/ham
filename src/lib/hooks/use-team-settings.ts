import useSWR, { mutate } from "swr";
import type { Team, TeamMember, TeamInvite } from "@/lib/team-types";

export function useTeamSettings() {
  const { data: settingsData, isLoading: settingsLoading } = useSWR<{ team: Team }>(
    "/api/team/settings",
  );
  const { data: membersData, isLoading: membersLoading } = useSWR<{ members: TeamMember[] }>(
    "/api/team/members",
  );
  const { data: invitesData, isLoading: invitesLoading } = useSWR<{ invites: TeamInvite[] }>(
    "/api/team/invite",
  );

  return {
    team: settingsData?.team ?? null,
    members: membersData?.members ?? [],
    invites: invitesData?.invites ?? [],
    isLoading: settingsLoading || membersLoading || invitesLoading,
    mutateSettings: () => mutate("/api/team/settings"),
    mutateMembers: () => mutate("/api/team/members"),
    mutateInvites: () => mutate("/api/team/invite"),
  };
}

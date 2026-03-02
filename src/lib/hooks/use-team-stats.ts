import useSWR from "swr";
import type { TimeRange, TeamDashboardData } from "@/lib/team-types";

export function useTeamStats(days: TimeRange) {
  return useSWR<TeamDashboardData>(
    `/api/team/stats?days=${days}`,
    {
      keepPreviousData: true,
      dedupingInterval: 10_000,
    },
  );
}

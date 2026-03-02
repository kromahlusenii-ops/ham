import useSWR from "swr";
import type {
  TimeRange,
  TeamTotals,
  DailySpend,
  ModelSpend,
  CarbonMetrics,
  CarbonByModel,
  BenchmarkComparison,
} from "@/lib/team-types";

interface RepoAnalyticsData {
  empty: boolean;
  totals?: TeamTotals;
  totalSessions?: number;
  totalMessages?: number;
  dailySpend?: DailySpend[];
  modelSpend?: ModelSpend[];
  carbon?: CarbonMetrics;
  carbonByModel?: CarbonByModel[];
  benchmark?: BenchmarkComparison;
}

export function useRepoAnalytics(repoId: string, days: TimeRange) {
  return useSWR<RepoAnalyticsData>(
    `/api/repos/${repoId}/analytics?days=${days}`,
    {
      keepPreviousData: true,
      dedupingInterval: 10_000,
    },
  );
}

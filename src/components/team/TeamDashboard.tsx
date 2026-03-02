"use client";

import { useState } from "react";
import type { Team, TeamMember, TimeRange } from "@/lib/team-types";
import { useTeamStats } from "@/lib/hooks/use-team-stats";
import TeamHeader from "./TeamHeader";
import TeamTotals from "./TeamTotals";
import SpendTrend from "./SpendTrend";
import CostByEngineer from "./CostByEngineer";
import CostByProject from "./CostByProject";
import ModelBreakdown from "./ModelBreakdown";
import CarbonSection from "./CarbonSection";
import BenchmarkSection from "./BenchmarkSection";
import AdoptionSection from "./AdoptionSection";
import InviteModal from "./InviteModal";

export default function TeamDashboard({
  team,
  members,
  isOwner,
}: {
  team: Team;
  members: TeamMember[];
  isOwner: boolean;
}) {
  const [timeRange, setTimeRange] = useState<TimeRange>(30);
  const [inviteOpen, setInviteOpen] = useState(false);
  const { data, isLoading } = useTeamStats(timeRange);

  function handleTimeRangeChange(range: TimeRange) {
    setTimeRange(range);
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <TeamHeader
          team={team}
          timeRange={timeRange}
          onTimeRangeChange={handleTimeRangeChange}
          isOwner={isOwner}
          onInvite={() => setInviteOpen(true)}
        />
        <div className="py-24 text-center text-sm text-gray">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <TeamHeader
        team={team}
        timeRange={timeRange}
        onTimeRangeChange={handleTimeRangeChange}
        isOwner={isOwner}
        onInvite={() => setInviteOpen(true)}
      />

      <TeamTotals totals={data.totals} />
      <SpendTrend data={data.dailySpend} />
      <CostByEngineer engineers={data.engineerSpend} />
      <CostByProject projects={data.projectSpend} />
      <ModelBreakdown models={data.modelSpend} />
      <CarbonSection
        carbon={data.carbon}
        byEngineer={data.carbonByEngineer}
        byModel={data.carbonByModel}
        dailySpend={data.dailySpend}
      />
      <BenchmarkSection
        benchmark={data.benchmark}
        engineerBenchmarks={data.engineerBenchmarks}
        activeEngineers={data.totals.activeEngineers}
      />
      <AdoptionSection adoption={data.adoption} />

      {inviteOpen && <InviteModal onClose={() => setInviteOpen(false)} />}
    </div>
  );
}

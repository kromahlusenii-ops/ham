import type {
  BenchmarkTask,
  TeamMember,
  BenchmarkComparison,
  EngineerBenchmark,
  BenchmarkStatus,
} from "./team-types";

export function computeTeamBenchmark(
  tasks: BenchmarkTask[],
  members: TeamMember[],
): BenchmarkComparison {
  const baseline = tasks.filter((t) => !t.ham_active);
  const hamActive = tasks.filter((t) => t.ham_active);

  if (baseline.length === 0 || hamActive.length === 0) {
    return {
      avgTokenReduction: 0,
      avgTimeReduction: 0,
      avgCacheImprovement: 0,
      totalTasks: tasks.length,
      rows: [],
    };
  }

  const avgBaselineTokens = baseline.reduce((s, t) => s + t.tokens, 0) / baseline.length;
  const avgHamTokens = hamActive.reduce((s, t) => s + t.tokens, 0) / hamActive.length;
  const avgBaselineTime = baseline.reduce((s, t) => s + t.duration_sec, 0) / baseline.length;
  const avgHamTime = hamActive.reduce((s, t) => s + t.duration_sec, 0) / hamActive.length;
  const avgBaselineCache = baseline.reduce((s, t) => s + t.cache_read_tokens, 0) / baseline.length;
  const avgHamCache = hamActive.reduce((s, t) => s + t.cache_read_tokens, 0) / hamActive.length;
  const avgBaselineCost = baseline.reduce((s, t) => s + t.cost_usd, 0) / baseline.length;
  const avgHamCost = hamActive.reduce((s, t) => s + t.cost_usd, 0) / hamActive.length;
  const avgBaselineCo2e = baseline.reduce((s, t) => s + t.co2e_grams, 0) / baseline.length;
  const avgHamCo2e = hamActive.reduce((s, t) => s + t.co2e_grams, 0) / hamActive.length;

  const tokenReduction = avgBaselineTokens > 0 ? ((avgBaselineTokens - avgHamTokens) / avgBaselineTokens) * 100 : 0;
  const timeReduction = avgBaselineTime > 0 ? ((avgBaselineTime - avgHamTime) / avgBaselineTime) * 100 : 0;
  const cacheImprovement = avgBaselineCache > 0 ? ((avgHamCache - avgBaselineCache) / avgBaselineCache) * 100 : 0;

  const fmt = (n: number) => n.toFixed(1);
  const fmtPct = (n: number) => `${n > 0 ? "-" : "+"}${Math.abs(n).toFixed(1)}%`;

  const rows = [
    { metric: "Tokens / task", baseline: fmt(avgBaselineTokens), hamActive: fmt(avgHamTokens), change: fmtPct(tokenReduction) },
    { metric: "Duration (sec)", baseline: fmt(avgBaselineTime), hamActive: fmt(avgHamTime), change: fmtPct(timeReduction) },
    { metric: "Cache tokens", baseline: fmt(avgBaselineCache), hamActive: fmt(avgHamCache), change: fmtPct(-cacheImprovement) },
    { metric: "Cost / task", baseline: `$${avgBaselineCost.toFixed(4)}`, hamActive: `$${avgHamCost.toFixed(4)}`, change: fmtPct(avgBaselineCost > 0 ? ((avgBaselineCost - avgHamCost) / avgBaselineCost) * 100 : 0) },
    { metric: "CO2e / task (g)", baseline: fmt(avgBaselineCo2e), hamActive: fmt(avgHamCo2e), change: fmtPct(avgBaselineCo2e > 0 ? ((avgBaselineCo2e - avgHamCo2e) / avgBaselineCo2e) * 100 : 0) },
  ];

  return {
    avgTokenReduction: Math.round(tokenReduction * 10) / 10,
    avgTimeReduction: Math.round(timeReduction * 10) / 10,
    avgCacheImprovement: Math.round(cacheImprovement * 10) / 10,
    totalTasks: tasks.length,
    rows,
  };
}

export function computeEngineerBenchmarks(
  tasks: BenchmarkTask[],
  members: TeamMember[],
): EngineerBenchmark[] {
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const byEngineer: Record<string, BenchmarkTask[]> = {};

  for (const t of tasks) {
    if (!byEngineer[t.engineer_id]) byEngineer[t.engineer_id] = [];
    byEngineer[t.engineer_id].push(t);
  }

  // Include members with no tasks as "Not started"
  const result: EngineerBenchmark[] = members.map((m) => {
    const eTasks = byEngineer[m.id] ?? [];
    const baseline = eTasks.filter((t) => !t.ham_active);
    const ham = eTasks.filter((t) => t.ham_active);
    const status = getEngineerBenchmarkStatus(eTasks);

    let tokenReduction: number | null = null;
    let timeReduction: number | null = null;

    if (baseline.length > 0 && ham.length > 0) {
      const avgBaseTokens = baseline.reduce((s, t) => s + t.tokens, 0) / baseline.length;
      const avgHamTokens = ham.reduce((s, t) => s + t.tokens, 0) / ham.length;
      const avgBaseTime = baseline.reduce((s, t) => s + t.duration_sec, 0) / baseline.length;
      const avgHamTime = ham.reduce((s, t) => s + t.duration_sec, 0) / ham.length;
      tokenReduction = avgBaseTokens > 0 ? Math.round(((avgBaseTokens - avgHamTokens) / avgBaseTokens) * 1000) / 10 : null;
      timeReduction = avgBaseTime > 0 ? Math.round(((avgBaseTime - avgHamTime) / avgBaseTime) * 1000) / 10 : null;
    }

    return {
      engineerId: m.id,
      displayName: m.display_name ?? m.github_username,
      githubUsername: m.github_username,
      status,
      baselineTasks: baseline.length,
      hamTasks: ham.length,
      tokenReduction,
      timeReduction,
    };
  });

  return result;
}

export function getEngineerBenchmarkStatus(tasks: BenchmarkTask[]): BenchmarkStatus {
  if (tasks.length === 0) return "Not started";
  const hasBaseline = tasks.some((t) => !t.ham_active);
  const hasHam = tasks.some((t) => t.ham_active);
  if (hasBaseline && hasHam) return "Proven";
  return "Baseline in progress";
}

export function projectMonthlySavings(
  comparison: BenchmarkComparison,
  activeEngineers: number,
  tasksPerMonth: number = 100,
): string {
  if (comparison.avgTokenReduction <= 0) return "$0";
  // Rough estimate: 50% token reduction → proportional cost savings
  const avgCostSaved = comparison.rows.find((r) => r.metric === "Cost / task");
  if (!avgCostSaved) return "$0";
  const baselineCost = parseFloat(avgCostSaved.baseline.replace("$", ""));
  const hamCost = parseFloat(avgCostSaved.hamActive.replace("$", ""));
  const savingsPerTask = baselineCost - hamCost;
  const monthly = savingsPerTask * tasksPerMonth * activeEngineers;
  if (monthly >= 1000) return `$${(monthly / 1000).toFixed(1)}K`;
  return `$${monthly.toFixed(0)}`;
}

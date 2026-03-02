import type {
  SessionSummary,
  TeamMember,
  BenchmarkTask,
  TeamTotals,
  DailySpend,
  EngineerSpend,
  ProjectSpend,
  ModelSpend,
  CarbonMetrics,
  CarbonByEngineer,
  CarbonByModel,
  AdoptionMetrics,
  TimeRange,
} from "./team-types";
import { modelDisplayName } from "./model-pricing";
import { equivalentSmartphoneCharges } from "./carbon";

// ─── Helpers ───

function toDateKey(ts: string): string {
  return new Date(ts).toISOString().slice(0, 10);
}

export function filterByTimeRange(sessions: SessionSummary[], days: TimeRange): SessionSummary[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return sessions.filter((s) => new Date(s.start_time) >= cutoff);
}

function primaryModel(sessions: SessionSummary[]): string {
  const counts: Record<string, number> = {};
  for (const s of sessions) {
    counts[s.model] = (counts[s.model] || 0) + 1;
  }
  let top = "";
  let max = 0;
  for (const [m, c] of Object.entries(counts)) {
    if (c > max) {
      top = m;
      max = c;
    }
  }
  return modelDisplayName(top);
}

function computeFlags(cost: number, avgCost: number, model: string): string[] {
  const flags: string[] = [];
  if (model.includes("opus")) flags.push("Expensive model");
  if (cost > avgCost * 2) flags.push("High spend");
  return flags;
}

// ─── Aggregation ───

export function computeTeamTotals(sessions: SessionSummary[], members: TeamMember[]): TeamTotals {
  const totalSpend = sessions.reduce((sum, s) => sum + s.cost_usd, 0);
  const totalTokens = sessions.reduce((sum, s) => sum + s.input_tokens + s.output_tokens, 0);
  const activeIds = new Set(sessions.map((s) => s.engineer_id));
  const activeEngineers = activeIds.size;
  const totalCo2eGrams = sessions.reduce((sum, s) => sum + s.co2e_grams, 0);

  return {
    totalSpend: Math.round(totalSpend * 100) / 100,
    totalTokens,
    activeEngineers,
    avgCostPerEngineer: activeEngineers > 0 ? Math.round((totalSpend / activeEngineers) * 100) / 100 : 0,
    totalCo2eGrams: Math.round(totalCo2eGrams * 100) / 100,
  };
}

export function computeDailySpend(sessions: SessionSummary[], days: TimeRange): DailySpend[] {
  const byDate: Record<string, DailySpend> = {};

  for (const s of sessions) {
    const date = toDateKey(s.start_time);
    if (!byDate[date]) {
      byDate[date] = { date, total: 0, opus: 0, sonnet: 0, haiku: 0 };
    }
    const d = byDate[date];
    d.total += s.cost_usd;
    if (s.model.includes("opus")) d.opus += s.cost_usd;
    else if (s.model.includes("haiku")) d.haiku += s.cost_usd;
    else d.sonnet += s.cost_usd;
  }

  // Fill missing dates
  const result: DailySpend[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = toDateKey(d.toISOString());
    const entry = byDate[key] ?? { date: key, total: 0, opus: 0, sonnet: 0, haiku: 0 };
    result.push({
      ...entry,
      total: Math.round(entry.total * 100) / 100,
      opus: Math.round(entry.opus * 100) / 100,
      sonnet: Math.round(entry.sonnet * 100) / 100,
      haiku: Math.round(entry.haiku * 100) / 100,
    });
  }

  return result;
}

export function computeEngineerSpend(
  sessions: SessionSummary[],
  members: TeamMember[],
): EngineerSpend[] {
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const byEngineer: Record<string, SessionSummary[]> = {};

  for (const s of sessions) {
    if (!byEngineer[s.engineer_id]) byEngineer[s.engineer_id] = [];
    byEngineer[s.engineer_id].push(s);
  }

  const totalSpend = sessions.reduce((sum, s) => sum + s.cost_usd, 0);
  const avgCost = Object.keys(byEngineer).length > 0 ? totalSpend / Object.keys(byEngineer).length : 0;

  return Object.entries(byEngineer)
    .map(([engineerId, eSessions]) => {
      const member = memberMap.get(engineerId);
      const cost = eSessions.reduce((sum, s) => sum + s.cost_usd, 0);
      const tokens = eSessions.reduce((sum, s) => sum + s.input_tokens + s.output_tokens, 0);
      const co2eGrams = eSessions.reduce((sum, s) => sum + s.co2e_grams, 0);
      const pm = primaryModel(eSessions);

      return {
        engineerId,
        displayName: member?.display_name ?? member?.github_username ?? "Unknown",
        githubUsername: member?.github_username ?? "unknown",
        githubAvatarUrl: member?.github_avatar_url ?? null,
        sessions: eSessions.length,
        tokens,
        cost: Math.round(cost * 100) / 100,
        co2eGrams: Math.round(co2eGrams * 100) / 100,
        avgCostPerSession: eSessions.length > 0 ? Math.round((cost / eSessions.length) * 100) / 100 : 0,
        primaryModel: pm,
        flags: computeFlags(cost, avgCost, eSessions[0]?.model ?? ""),
      };
    })
    .sort((a, b) => b.cost - a.cost);
}

export function computeProjectSpend(sessions: SessionSummary[]): ProjectSpend[] {
  const byProject: Record<string, SessionSummary[]> = {};

  for (const s of sessions) {
    if (!byProject[s.project_name]) byProject[s.project_name] = [];
    byProject[s.project_name].push(s);
  }

  return Object.entries(byProject)
    .map(([projectName, pSessions]) => ({
      projectName,
      engineers: new Set(pSessions.map((s) => s.engineer_id)).size,
      sessions: pSessions.length,
      tokens: pSessions.reduce((sum, s) => sum + s.input_tokens + s.output_tokens, 0),
      cost: Math.round(pSessions.reduce((sum, s) => sum + s.cost_usd, 0) * 100) / 100,
      co2eGrams: Math.round(pSessions.reduce((sum, s) => sum + s.co2e_grams, 0) * 100) / 100,
      topModel: primaryModel(pSessions),
    }))
    .sort((a, b) => b.cost - a.cost);
}

export function computeModelSpend(sessions: SessionSummary[]): ModelSpend[] {
  const byModel: Record<string, SessionSummary[]> = {};
  const totalSpend = sessions.reduce((sum, s) => sum + s.cost_usd, 0);

  for (const s of sessions) {
    const name = modelDisplayName(s.model);
    if (!byModel[name]) byModel[name] = [];
    byModel[name].push(s);
  }

  return Object.entries(byModel)
    .map(([model, mSessions]) => {
      const cost = mSessions.reduce((sum, s) => sum + s.cost_usd, 0);
      return {
        model,
        sessions: mSessions.length,
        tokens: mSessions.reduce((sum, s) => sum + s.input_tokens + s.output_tokens, 0),
        cost: Math.round(cost * 100) / 100,
        percentOfSpend: totalSpend > 0 ? Math.round((cost / totalSpend) * 1000) / 10 : 0,
        status: (model === "Opus" ? "Expensive" : model === "Haiku" ? "Budget" : "Efficient") as ModelSpend["status"],
      };
    })
    .sort((a, b) => b.cost - a.cost);
}

export function computeCarbonMetrics(sessions: SessionSummary[]): CarbonMetrics {
  const totalCo2eGrams = sessions.reduce((sum, s) => sum + s.co2e_grams, 0);
  const totalEnergyWh = sessions.reduce((sum, s) => sum + s.energy_wh, 0);
  const hamSessions = sessions.filter((s) => s.is_ham_on);
  const co2eSavedGrams = hamSessions.reduce((sum, s) => sum + s.co2e_grams * 0.5, 0); // HAM ~50% savings

  return {
    totalCo2eGrams: Math.round(totalCo2eGrams * 100) / 100,
    totalEnergyWh: Math.round(totalEnergyWh * 100) / 100,
    co2eSavedGrams: Math.round(co2eSavedGrams * 100) / 100,
    equivalentCharges: equivalentSmartphoneCharges(totalCo2eGrams),
  };
}

export function computeCarbonByEngineer(
  sessions: SessionSummary[],
  members: TeamMember[],
): CarbonByEngineer[] {
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const byEngineer: Record<string, { co2eGrams: number; energyWh: number }> = {};

  for (const s of sessions) {
    if (!byEngineer[s.engineer_id]) byEngineer[s.engineer_id] = { co2eGrams: 0, energyWh: 0 };
    byEngineer[s.engineer_id].co2eGrams += s.co2e_grams;
    byEngineer[s.engineer_id].energyWh += s.energy_wh;
  }

  return Object.entries(byEngineer)
    .map(([engineerId, data]) => {
      const member = memberMap.get(engineerId);
      return {
        engineerId,
        displayName: member?.display_name ?? member?.github_username ?? "Unknown",
        co2eGrams: Math.round(data.co2eGrams * 100) / 100,
        energyWh: Math.round(data.energyWh * 100) / 100,
      };
    })
    .sort((a, b) => b.co2eGrams - a.co2eGrams);
}

export function computeCarbonByModel(sessions: SessionSummary[]): CarbonByModel[] {
  const byModel: Record<string, { co2eGrams: number; energyWh: number }> = {};

  for (const s of sessions) {
    const name = modelDisplayName(s.model);
    if (!byModel[name]) byModel[name] = { co2eGrams: 0, energyWh: 0 };
    byModel[name].co2eGrams += s.co2e_grams;
    byModel[name].energyWh += s.energy_wh;
  }

  return Object.entries(byModel)
    .map(([model, data]) => ({
      model,
      co2eGrams: Math.round(data.co2eGrams * 100) / 100,
      energyWh: Math.round(data.energyWh * 100) / 100,
    }))
    .sort((a, b) => b.co2eGrams - a.co2eGrams);
}

export function computeAdoption(
  sessions: SessionSummary[],
  members: TeamMember[],
  benchmarks: BenchmarkTask[],
): AdoptionMetrics {
  const hamSessions = sessions.filter((s) => s.is_ham_on);
  const hamAdoptionRate = sessions.length > 0 ? Math.round((hamSessions.length / sessions.length) * 100) : 0;
  const estimatedSavings = hamSessions.reduce((sum, s) => sum + s.cost_usd * 0.5, 0);
  const engineersWithBenchmarks = new Set(benchmarks.map((b) => b.engineer_id));
  const benchmarkCompletion = members.length > 0
    ? Math.round((engineersWithBenchmarks.size / members.length) * 100)
    : 0;
  const activeEngineerIds = new Set(sessions.map((s) => s.engineer_id));
  const hamEngineerIds = new Set(hamSessions.map((s) => s.engineer_id));
  const notUsingHam = members
    .filter((m) => activeEngineerIds.has(m.id) && !hamEngineerIds.has(m.id))
    .map((m) => m.display_name ?? m.github_username);

  return {
    hamAdoptionRate,
    estimatedSavings: Math.round(estimatedSavings * 100) / 100,
    benchmarkCompletion,
    engineersNotUsingHam: notUsingHam,
  };
}

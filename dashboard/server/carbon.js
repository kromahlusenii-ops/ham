import { estimateTokens, toDateKey } from './utils.js';

// --- EcoLogits energy model constants ---

const ALPHA = 8.91e-5;          // GPU energy coefficient
const BETA = 1.43e-3;           // GPU energy intercept
const PUE = 1.2;                // Power Usage Effectiveness
const CARBON_INTENSITY = 0.385; // kgCO2/kWh (US grid average)
const PP_TG_RATIO = 30;         // prefill-to-decode speed ratio
const SERVER_POWER_W = 1000;    // non-GPU server power

const MODEL_CARBON = {
  'claude-opus-4-6':             { activeParams: 60, gpus: 4, genSpeed: 30 },
  'claude-sonnet-4-6':           { activeParams: 70, gpus: 2, genSpeed: 50 },
  'claude-sonnet-4-5-20250514':  { activeParams: 70, gpus: 2, genSpeed: 50 },
  'claude-haiku-4-5-20251001':   { activeParams: 20, gpus: 1, genSpeed: 100 },
  'claude-3-5-sonnet-20241022':  { activeParams: 70, gpus: 2, genSpeed: 50 },
  'claude-3-5-haiku-20241022':   { activeParams: 20, gpus: 1, genSpeed: 100 },
  'claude-sonnet-4-20250514':    { activeParams: 70, gpus: 2, genSpeed: 50 },
  default:                       { activeParams: 70, gpus: 2, genSpeed: 50 },
};

// --- Helpers ---

function filterByDays(sessions, days) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return sessions.filter(s => s.startTime && new Date(s.startTime) >= cutoff);
}

function getModelCarbon(model) {
  return MODEL_CARBON[model] || MODEL_CARBON.default;
}

/**
 * Calculate energy (Wh) and CO2e (grams) for a single session.
 */
function sessionEnergy(inputTokens, outputTokens, model) {
  const { activeParams, gpus, genSpeed } = getModelCarbon(model);

  const E_GPU = outputTokens * (ALPHA * activeParams + BETA);
  const E_prefill = inputTokens * (ALPHA * activeParams + BETA) / PP_TG_RATIO;
  const E_server = (outputTokens / genSpeed) * (SERVER_POWER_W / 3600) * (gpus / 8);
  const E_total = (E_GPU + E_prefill + E_server) * PUE;
  const CO2e_g = E_total * CARBON_INTENSITY; // Wh * kgCO2/kWh → gCO2 (since Wh/1000*kg*1000)

  return { energy_wh: E_total, co2e_grams: CO2e_g };
}

/**
 * Sum all CLAUDE.md file tokens in the project (naive baseline).
 * Uses health entries from checkContextHealth().
 */
function getNaiveBaselineTokens(healthEntries) {
  let totalBytes = 0;
  for (const entry of healthEntries) {
    if (entry.hasClaude && entry.fileSize > 0) {
      totalBytes += entry.fileSize;
    }
  }
  return estimateTokens(totalBytes);
}

// --- Exported functions ---

/**
 * Aggregate carbon stats for Efficiency tab hero + cumulative sections.
 */
export function calculateCarbon(sessions, days, projectPath, healthEntries = []) {
  const filtered = filterByDays(sessions, days);
  const naiveBaselineTokens = getNaiveBaselineTokens(healthEntries);

  let totalActualEnergy = 0;
  let totalBaselineEnergy = 0;
  let totalActualCO2e = 0;
  let totalBaselineCO2e = 0;
  let totalRequests = 0;
  let totalActualInputTokens = 0;
  let totalBaselineInputTokens = 0;

  for (const s of filtered) {
    const prompts = s.messageCount || 1;
    totalRequests += prompts;

    // Actual energy
    const actual = sessionEnergy(s.inputTokens, s.outputTokens, s.model);
    totalActualEnergy += actual.energy_wh;
    totalActualCO2e += actual.co2e_grams;
    totalActualInputTokens += s.inputTokens;

    // Baseline: naive would load all CLAUDE.md tokens per request
    const baselineInput = naiveBaselineTokens * prompts;
    totalBaselineInputTokens += baselineInput;
    const baseline = sessionEnergy(baselineInput, s.outputTokens, s.model);
    totalBaselineEnergy += baseline.energy_wh;
    totalBaselineCO2e += baseline.co2e_grams;
  }

  const tokenEfficiency = totalBaselineInputTokens > 0
    ? Math.round((1 - totalActualInputTokens / totalBaselineInputTokens) * 1000) / 10
    : 0;

  const trackingSince = filtered.length > 0
    ? filtered.reduce((earliest, s) => {
        const t = new Date(s.startTime).getTime();
        return t < earliest ? t : earliest;
      }, Infinity)
    : null;

  return {
    days,
    totalSessions: filtered.length,
    totalRequests,
    tokenEfficiency,
    totalEnergy: {
      actual_wh: Math.round(totalActualEnergy * 100) / 100,
      baseline_wh: Math.round(totalBaselineEnergy * 100) / 100,
      saved_wh: Math.round((totalBaselineEnergy - totalActualEnergy) * 100) / 100,
    },
    totalCO2e: {
      actual_grams: Math.round(totalActualCO2e * 100) / 100,
      baseline_grams: Math.round(totalBaselineCO2e * 100) / 100,
      saved_grams: Math.round((totalBaselineCO2e - totalActualCO2e) * 100) / 100,
    },
    naiveBaselineTokens,
    trackingSince: trackingSince ? new Date(trackingSince).toISOString() : null,
  };
}

/**
 * Per-day breakdown for "This Week" table.
 */
export function calculateCarbonDaily(sessions, days, projectPath, healthEntries = []) {
  const filtered = filterByDays(sessions, days);
  const naiveBaselineTokens = getNaiveBaselineTokens(healthEntries);
  const byDate = {};

  for (const s of filtered) {
    const date = toDateKey(s.startTime);
    if (!byDate[date]) {
      byDate[date] = { date, sessions: 0, prompts: 0, co2e_saved_grams: 0, tokens_saved: 0 };
    }
    const d = byDate[date];
    const prompts = s.messageCount || 1;
    d.sessions++;
    d.prompts += prompts;

    const actual = sessionEnergy(s.inputTokens, s.outputTokens, s.model);
    const baselineInput = naiveBaselineTokens * prompts;
    const baseline = sessionEnergy(baselineInput, s.outputTokens, s.model);

    d.co2e_saved_grams += baseline.co2e_grams - actual.co2e_grams;
    d.tokens_saved += Math.max(0, baselineInput - s.inputTokens);
  }

  // Fill missing dates
  const result = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = toDateKey(d.toISOString());
    const entry = byDate[key] || { date: key, sessions: 0, prompts: 0, co2e_saved_grams: 0, tokens_saved: 0 };
    entry.co2e_saved_grams = Math.round(entry.co2e_saved_grams * 100) / 100;
    result.push(entry);
  }

  return result;
}

/**
 * Per-session breakdown for "Recent Sessions" table.
 */
export function calculateCarbonSessions(sessions, days, projectPath, healthEntries = []) {
  const filtered = filterByDays(sessions, days);
  const naiveBaselineTokens = getNaiveBaselineTokens(healthEntries);

  return filtered.slice(0, 20).map(s => {
    const prompts = s.messageCount || 1;
    const baselineTokens = naiveBaselineTokens * prompts;
    const tokenSavingsPercent = baselineTokens > 0
      ? Math.round((1 - s.inputTokens / baselineTokens) * 1000) / 10
      : 0;

    const actual = sessionEnergy(s.inputTokens, s.outputTokens, s.model);
    const baseline = sessionEnergy(baselineTokens, s.outputTokens, s.model);

    // Build per-file stats from claudeMdReads
    const fileMap = {};
    for (const fp of (s.claudeMdReads || [])) {
      if (!fileMap[fp]) fileMap[fp] = { path: fp, tokens: 0, loadCount: 0 };
      fileMap[fp].loadCount++;
    }
    // Estimate tokens per file (we don't have file sizes in session data, estimate from path)
    const filesLoaded = Object.values(fileMap);

    return {
      sessionId: s.sessionId,
      startTime: s.startTime,
      durationMs: s.durationMs,
      model: s.model,
      prompts,
      inputTokens: s.inputTokens,
      outputTokens: s.outputTokens,
      baselineTokens,
      tokenSavingsPercent,
      energy_wh: Math.round(actual.energy_wh * 100) / 100,
      baseline_energy_wh: Math.round(baseline.energy_wh * 100) / 100,
      saved_wh: Math.round((baseline.energy_wh - actual.energy_wh) * 100) / 100,
      co2e_grams: Math.round(actual.co2e_grams * 100) / 100,
      baseline_co2e_grams: Math.round(baseline.co2e_grams * 100) / 100,
      saved_grams: Math.round((baseline.co2e_grams - actual.co2e_grams) * 100) / 100,
      filesLoaded,
    };
  });
}

/**
 * Per-CLAUDE.md file stats for "Project Breakdown" table.
 */
export function calculateCarbonFiles(sessions, days, projectPath, healthEntries = []) {
  const filtered = filterByDays(sessions, days);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Count loads per CLAUDE.md file in last 7 days
  const loadCounts = {};
  for (const s of filtered) {
    if (new Date(s.startTime) < sevenDaysAgo) continue;
    for (const fp of (s.claudeMdReads || [])) {
      loadCounts[fp] = (loadCounts[fp] || 0) + 1;
    }
  }

  return healthEntries
    .filter(e => e.hasClaude)
    .map(e => {
      const tokens = estimateTokens(e.fileSize);
      const loads7d = loadCounts[e.path] || 0;
      const loadsPerDay = Math.round((loads7d / 7) * 10) / 10;

      let status = 'ok';
      if (tokens * loadsPerDay > 10000) {
        status = 'split_this';
      } else if (tokens > 200 && loadsPerDay > 10) {
        status = 'consider_splitting';
      }

      // Check staleness: if not loaded in 14+ days
      const lastLoaded = filtered.some(s =>
        (s.claudeMdReads || []).includes(e.path) &&
        new Date(s.startTime) >= new Date(Date.now() - 14 * 86400000)
      );
      if (!lastLoaded && loads7d === 0) {
        status = 'stale';
      }

      return { path: e.path, tokens, loads7d, loadsPerDay, status };
    })
    .sort((a, b) => b.loads7d - a.loads7d);
}

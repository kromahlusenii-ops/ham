import { calculateCost, toDateKey } from './utils.js';

/**
 * Calculate aggregate stats from parsed sessions.
 * @param {Array} sessions - Parsed session objects
 * @param {number} days - Number of days to include
 * @returns {Object} Aggregate statistics
 */
export function calculateStats(sessions, days = 30) {
  const filtered = filterByDays(sessions, days);
  const { hamOn, hamOff } = splitByHam(filtered);

  // Baseline: avg input tokens per file read in HAM-off sessions
  const baseline = calculateBaseline(hamOn, hamOff);

  // Savings for HAM-on sessions
  let totalTokensSaved = 0;
  let totalCostSaved = 0;

  for (const s of hamOn) {
    const nonClaudeReads = s.fileReads.filter(f => !f.endsWith('/CLAUDE.md') && !f.endsWith('CLAUDE.md')).length || 1;
    const expected = nonClaudeReads * baseline.avgTokensPerRead;
    const saved = Math.max(0, expected - s.inputTokens);
    totalTokensSaved += saved;
    totalCostSaved += calculateCost(saved, 0, s.model || 'claude-sonnet-4-6');
  }

  const totalSessions = filtered.length;
  const hamOnCount = hamOn.length;
  const hamOffCount = hamOff.length;
  const coveragePercent = totalSessions > 0
    ? Math.round((hamOnCount / totalSessions) * 100)
    : 0;

  // Routing counts
  const routedCount = filtered.filter(s => s.routingStatus === 'routed').length;
  const likelyRoutedCount = filtered.filter(s => s.routingStatus === 'likely').length;
  const unroutedCount = filtered.filter(s => s.routingStatus === 'unrouted').length;
  const routedPercent = totalSessions > 0
    ? Math.round(((routedCount + likelyRoutedCount) / totalSessions) * 100)
    : 0;

  const totalInputTokens = filtered.reduce((sum, s) => sum + s.inputTokens, 0);
  const totalOutputTokens = filtered.reduce((sum, s) => sum + s.outputTokens, 0);
  const totalCacheRead = filtered.reduce((sum, s) => sum + s.cacheReadTokens, 0);
  const totalCost = filtered.reduce(
    (sum, s) => sum + calculateCost(s.inputTokens, s.outputTokens, s.model || 'claude-sonnet-4-6'),
    0
  );
  const avgFileReads = totalSessions > 0
    ? Math.round(filtered.reduce((sum, s) => sum + s.fileReads.length, 0) / totalSessions)
    : 0;

  return {
    days,
    totalSessions,
    hamOnCount,
    hamOffCount,
    coveragePercent,
    routedCount,
    likelyRoutedCount,
    unroutedCount,
    routedPercent,
    totalTokensSaved,
    totalCostSaved: Math.round(totalCostSaved * 100) / 100,
    totalInputTokens,
    totalOutputTokens,
    totalCacheRead,
    totalCost: Math.round(totalCost * 100) / 100,
    avgFileReads,
    baseline: {
      avgTokensPerRead: Math.round(baseline.avgTokensPerRead),
      sampleSize: baseline.sampleSize,
    },
  };
}

/**
 * Calculate daily breakdown for chart data.
 */
export function calculateDaily(sessions, days = 30) {
  const filtered = filterByDays(sessions, days);
  const byDate = {};

  for (const s of filtered) {
    const date = toDateKey(s.startTime);
    if (!byDate[date]) {
      byDate[date] = {
        date,
        sessions: 0,
        hamOnSessions: 0,
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cost: 0,
        fileReads: 0,
      };
    }
    const d = byDate[date];
    d.sessions++;
    if (s.isHamOn) d.hamOnSessions++;
    d.inputTokens += s.inputTokens;
    d.outputTokens += s.outputTokens;
    d.cacheReadTokens += s.cacheReadTokens;
    d.cost += calculateCost(s.inputTokens, s.outputTokens, s.model || 'claude-sonnet-4-6');
    d.fileReads += s.fileReads.length;
  }

  // Fill in missing dates
  const result = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = toDateKey(d.toISOString());
    result.push(byDate[key] || {
      date: key,
      sessions: 0,
      hamOnSessions: 0,
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cost: 0,
      fileReads: 0,
    });
  }

  // Round costs
  for (const d of result) {
    d.cost = Math.round(d.cost * 100) / 100;
  }

  return result;
}

/**
 * Calculate per-directory breakdown.
 */
export function calculateDirectories(sessions, days = 30) {
  const filtered = filterByDays(sessions, days);
  const byDir = {};

  for (const s of filtered) {
    const dir = s.primaryDirectory || '(unattributed)';
    if (!byDir[dir]) {
      byDir[dir] = {
        directory: dir,
        sessions: 0,
        hamOnSessions: 0,
        inputTokens: 0,
        outputTokens: 0,
        fileReads: 0,
        cost: 0,
      };
    }
    const d = byDir[dir];
    d.sessions++;
    if (s.isHamOn) d.hamOnSessions++;
    d.inputTokens += s.inputTokens;
    d.outputTokens += s.outputTokens;
    d.fileReads += s.fileReads.length;
    d.cost += calculateCost(s.inputTokens, s.outputTokens, s.model || 'claude-sonnet-4-6');
  }

  return Object.values(byDir)
    .map(d => ({ ...d, cost: Math.round(d.cost * 100) / 100 }))
    .sort((a, b) => b.sessions - a.sessions);
}

// --- Helpers ---

function filterByDays(sessions, days) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return sessions.filter(s => s.startTime && new Date(s.startTime) >= cutoff);
}

function splitByHam(sessions) {
  const hamOn = sessions.filter(s => s.isHamOn);
  const hamOff = sessions.filter(s => !s.isHamOn);
  return { hamOn, hamOff };
}

function calculateBaseline(hamOn, hamOff) {
  // Use HAM-off sessions to establish baseline tokens per file read
  if (hamOff.length >= 3) {
    let totalTokens = 0;
    let totalReads = 0;
    for (const s of hamOff) {
      const reads = s.fileReads.length;
      if (reads > 0) {
        totalTokens += s.inputTokens;
        totalReads += reads;
      }
    }
    if (totalReads > 0) {
      return {
        avgTokensPerRead: totalTokens / totalReads,
        sampleSize: hamOff.length,
      };
    }
  }

  // Fallback: use HAM-on average × 5 multiplier
  if (hamOn.length > 0) {
    let totalTokens = 0;
    let totalReads = 0;
    for (const s of hamOn) {
      const reads = s.fileReads.length;
      if (reads > 0) {
        totalTokens += s.inputTokens;
        totalReads += reads;
      }
    }
    if (totalReads > 0) {
      return {
        avgTokensPerRead: (totalTokens / totalReads) * 5,
        sampleSize: hamOn.length,
      };
    }
  }

  // No data at all — conservative estimate
  return {
    avgTokensPerRead: 50000,
    sampleSize: 0,
  };
}

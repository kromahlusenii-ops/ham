/**
 * Generate personalized insights from the user's actual dashboard data.
 * Returns an array of insight strings tailored to their usage patterns.
 */
export function generateInsights(stats, health, daily, days) {
  const insights = [];

  // No data at all
  if (stats.totalSessions === 0) {
    return {
      summary: 'No Claude Code sessions found for this project in the last ' + days + ' days.',
      insights: ['Start a Claude Code session in this project to begin tracking usage.'],
    };
  }

  // Lead with the headline
  if (stats.totalSessions === 1) {
    insights.push(`You've had 1 session in the last ${days} days, using ${fmtTokens(stats.totalInputTokens)} input tokens ($${stats.totalCost.toFixed(2)}).`);
  } else {
    const avgTokensPerSession = Math.round(stats.totalInputTokens / stats.totalSessions);
    insights.push(`Across ${stats.totalSessions} sessions in the last ${days} days, you've used ${fmtTokens(stats.totalInputTokens)} input tokens at a cost of $${stats.totalCost.toFixed(2)} — averaging ${fmtTokens(avgTokensPerSession)} per session.`);
  }

  // HAM adoption
  if (stats.hamOnCount === 0 && stats.totalSessions > 0) {
    insights.push(`None of your sessions used HAM yet. Once you set up subdirectory CLAUDE.md files (run "go ham"), you'll start seeing token savings tracked here.`);
  } else if (stats.coveragePercent < 50) {
    insights.push(`HAM is active in ${stats.coveragePercent}% of sessions (${stats.hamOnCount} of ${stats.totalSessions}). Increasing CLAUDE.md coverage in your working directories would improve savings.`);
  } else if (stats.coveragePercent >= 80) {
    insights.push(`Strong HAM adoption — ${stats.coveragePercent}% of sessions are HAM-enabled. Estimated savings: ${fmtTokens(stats.totalTokensSaved)} tokens ($${stats.totalCostSaved.toFixed(2)}).`);
  } else {
    insights.push(`HAM is active in ${stats.coveragePercent}% of sessions. You've saved an estimated ${fmtTokens(stats.totalTokensSaved)} tokens ($${stats.totalCostSaved.toFixed(2)}).`);
  }

  // Cache efficiency
  if (stats.totalCacheRead > 0) {
    const cacheRatio = stats.totalCacheRead / (stats.totalInputTokens + stats.totalCacheRead);
    const cachePct = Math.round(cacheRatio * 100);
    if (cachePct > 70) {
      insights.push(`Your cache hit rate is ${cachePct}% — ${fmtTokens(stats.totalCacheRead)} tokens served from cache. This is keeping your costs significantly lower than raw input pricing.`);
    } else if (cachePct > 30) {
      insights.push(`${fmtTokens(stats.totalCacheRead)} tokens (${cachePct}%) are being served from cache. Longer sessions and consistent file reads help increase this ratio.`);
    }
  }

  // Activity trend
  const recentDays = daily.slice(-7);
  const activeDays = recentDays.filter(d => d.sessions > 0).length;
  if (days >= 7) {
    if (activeDays === 0) {
      insights.push(`No activity in the last 7 days.`);
    } else if (activeDays >= 5) {
      insights.push(`You've been active ${activeDays} of the last 7 days — consistent usage helps HAM's scoped context stay warm.`);
    }
  }

  // Health warnings
  const redDirs = health.filter(h => h.status === 'red');
  const amberDirs = health.filter(h => h.status === 'amber');
  const greenDirs = health.filter(h => h.status === 'green');

  if (redDirs.length > 0 && redDirs.length <= 5) {
    const names = redDirs.slice(0, 3).map(h => h.path).join(', ');
    const extra = redDirs.length > 3 ? ` and ${redDirs.length - 3} more` : '';
    insights.push(`${redDirs.length} directories with source files are missing CLAUDE.md: ${names}${extra}. Adding context files there will reduce token waste when Claude works in those areas.`);
  } else if (redDirs.length > 5) {
    insights.push(`${redDirs.length} directories are missing CLAUDE.md files. Run "go ham" to auto-generate context files across your project.`);
  }

  if (amberDirs.length > 0) {
    insights.push(`${amberDirs.length} context files may be stale — they haven't been updated despite recent session activity. Consider reviewing them.`);
  }

  if (greenDirs.length > 0 && redDirs.length === 0 && amberDirs.length === 0) {
    insights.push(`All ${greenDirs.length} directories with source files have up-to-date CLAUDE.md files. Your context coverage is complete.`);
  }

  // Build summary (first insight is always the lead)
  return {
    summary: insights[0] || '',
    insights: insights.slice(1),
  };
}

function fmtTokens(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

/**
 * Generate personalized insights from the user's actual dashboard data.
 * Returns a summary headline and an array of insight strings.
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

  // Lead headline
  if (stats.totalSessions === 1) {
    insights.push(`One session in the last ${days} days — ${fmtTokens(stats.totalInputTokens)} input tokens, $${stats.totalCost.toFixed(2)} spent.`);
  } else {
    const avgTokensPerSession = Math.round(stats.totalInputTokens / stats.totalSessions);
    insights.push(`${stats.totalSessions} sessions over ${days} days, averaging ${fmtTokens(avgTokensPerSession)} tokens each. Total spend: $${stats.totalCost.toFixed(2)}.`);
  }

  // HAM adoption — the filing cabinet analogy
  if (stats.hamOnCount === 0 && stats.totalSessions > 0) {
    insights.push(`No sessions are using HAM yet. Right now Claude is like someone rummaging through the whole filing cabinet every time they need one folder. Run "go ham" to set up scoped context files and you'll see savings start here.`);
  } else if (stats.coveragePercent < 50) {
    insights.push(`HAM is active in ${stats.coveragePercent}% of sessions (${stats.hamOnCount} of ${stats.totalSessions}). Think of it like having sticky notes on some drawers but not others — adding CLAUDE.md files to your active directories means Claude opens the right drawer first.`);
  } else if (stats.coveragePercent >= 80) {
    insights.push(`${stats.coveragePercent}% of sessions are using HAM — Claude almost always knows which drawer to open first. That's saved an estimated ${fmtTokens(stats.totalTokensSaved)} tokens ($${stats.totalCostSaved.toFixed(2)}).`);
  } else {
    insights.push(`HAM is active in ${stats.coveragePercent}% of sessions, saving an estimated ${fmtTokens(stats.totalTokensSaved)} tokens ($${stats.totalCostSaved.toFixed(2)}). More CLAUDE.md coverage = more drawers with labels = less time searching.`);
  }

  // Routing
  if (stats.routedPercent !== undefined) {
    if (stats.routedCount + stats.likelyRoutedCount === 0 && stats.totalSessions > 0) {
      insights.push(`No sessions are using Context Routing yet. Without it, Claude has to scan your directory tree like checking every floor of a building to find the right office. Add a routing section to your root CLAUDE.md (run "ham route") and Claude will take the elevator straight there.`);
    } else if (stats.routedPercent >= 70) {
      insights.push(`${stats.routedPercent}% of sessions follow Context Routing — Claude is reading the directory on the wall and going straight to the right office instead of wandering floor to floor.`);
    } else if (stats.routedPercent > 0) {
      insights.push(`${stats.routedPercent}% of sessions follow Context Routing. More routes means Claude spends less time scanning for context and more time on your actual task — like posting a directory in a building lobby so visitors don't wander.`);
    }
  }

  // Cache efficiency — the short-term memory analogy
  if (stats.totalCacheRead > 0) {
    const cacheRatio = stats.totalCacheRead / (stats.totalInputTokens + stats.totalCacheRead);
    const cachePct = Math.round(cacheRatio * 100);
    if (cachePct > 70) {
      insights.push(`Cache hit rate is ${cachePct}% — Claude is remembering ${fmtTokens(stats.totalCacheRead)} tokens from recent conversations instead of re-reading files. Like having a coworker who actually remembers yesterday's meeting.`);
    } else if (cachePct > 30) {
      insights.push(`${cachePct}% of tokens are coming from cache (${fmtTokens(stats.totalCacheRead)} tokens). That's Claude retaining context between messages instead of starting from scratch each time. Longer sessions push this number up.`);
    }
  }

  // Activity trend
  const recentDays = daily.slice(-7);
  const activeDays = recentDays.filter(d => d.sessions > 0).length;
  if (days >= 7) {
    if (activeDays === 0) {
      insights.push(`No activity in the last 7 days.`);
    } else if (activeDays >= 5) {
      insights.push(`Active ${activeDays} of the last 7 days — consistent use keeps Claude's cached context warm, like keeping a workspace open instead of packing up every night.`);
    }
  }

  // Health warnings — the map analogy
  const redDirs = health.filter(h => h.status === 'red');
  const amberDirs = health.filter(h => h.status === 'amber');
  const greenDirs = health.filter(h => h.status === 'green');

  if (redDirs.length > 0 && redDirs.length <= 5) {
    const names = redDirs.slice(0, 3).map(h => h.path).join(', ');
    const extra = redDirs.length > 3 ? ` and ${redDirs.length - 3} more` : '';
    insights.push(`${redDirs.length} directories are missing CLAUDE.md files: ${names}${extra}. These are rooms without a label on the door — Claude has to walk in and look around every time it works there.`);
  } else if (redDirs.length > 5) {
    insights.push(`${redDirs.length} directories are missing CLAUDE.md files. That's a lot of unlabeled rooms. Run "go ham" to generate context files across the project.`);
  }

  if (amberDirs.length > 0) {
    insights.push(`${amberDirs.length} context file${amberDirs.length > 1 ? 's' : ''} may be stale — like a map that hasn't been updated after renovations. Worth a quick review to make sure Claude isn't following outdated directions.`);
  }

  if (greenDirs.length > 0 && redDirs.length === 0 && amberDirs.length === 0) {
    insights.push(`All ${greenDirs.length} source directories have up-to-date CLAUDE.md files — full coverage. Every room is labeled, every drawer has a sticky note.`);
  }

  return {
    summary: insights[0] || '',
    insights: insights.slice(1),
  };
}

/**
 * Generate machine-readable structured insights for CLI/API consumption.
 * Returns JSON with categorized, severity-rated insight items.
 */
export function generateStructuredInsights(stats, health, daily, days) {
  const items = [];

  // HAM adoption
  if (stats.totalSessions > 0) {
    if (stats.hamOnCount === 0) {
      items.push({
        category: 'ham_adoption',
        severity: 'high',
        type: 'action',
        title: 'No sessions using HAM',
        detail: `0 of ${stats.totalSessions} sessions have HAM enabled.`,
        action: 'Run "go ham" to set up scoped context files.',
        data: { hamOnCount: 0, totalSessions: stats.totalSessions, coveragePercent: 0 },
      });
    } else if (stats.coveragePercent < 50) {
      items.push({
        category: 'ham_adoption',
        severity: 'medium',
        type: 'action',
        title: 'Low HAM adoption',
        detail: `HAM is active in ${stats.coveragePercent}% of sessions (${stats.hamOnCount} of ${stats.totalSessions}).`,
        action: 'Add CLAUDE.md files to active directories to increase coverage.',
        data: { hamOnCount: stats.hamOnCount, totalSessions: stats.totalSessions, coveragePercent: stats.coveragePercent },
      });
    } else if (stats.coveragePercent < 80) {
      items.push({
        category: 'ham_adoption',
        severity: 'low',
        type: 'observation',
        title: 'Moderate HAM adoption',
        detail: `HAM is active in ${stats.coveragePercent}% of sessions, saving ~${fmtTokens(stats.totalTokensSaved)} tokens ($${stats.totalCostSaved.toFixed(2)}).`,
        action: null,
        data: { hamOnCount: stats.hamOnCount, totalSessions: stats.totalSessions, coveragePercent: stats.coveragePercent, tokensSaved: stats.totalTokensSaved },
      });
    } else {
      items.push({
        category: 'ham_adoption',
        severity: 'low',
        type: 'positive',
        title: 'Strong HAM adoption',
        detail: `${stats.coveragePercent}% of sessions are using HAM, saving ~${fmtTokens(stats.totalTokensSaved)} tokens ($${stats.totalCostSaved.toFixed(2)}).`,
        action: null,
        data: { hamOnCount: stats.hamOnCount, totalSessions: stats.totalSessions, coveragePercent: stats.coveragePercent, tokensSaved: stats.totalTokensSaved },
      });
    }
  }

  // Context routing
  if (stats.routedPercent !== undefined && stats.totalSessions > 0) {
    const routedTotal = (stats.routedCount || 0) + (stats.likelyRoutedCount || 0);
    if (routedTotal === 0) {
      items.push({
        category: 'context_routing',
        severity: 'high',
        type: 'action',
        title: 'No sessions using Context Routing',
        detail: `0 of ${stats.totalSessions} sessions follow Context Routing.`,
        action: 'Add a routing section to your root CLAUDE.md (run "ham route").',
        data: { routedCount: 0, totalSessions: stats.totalSessions, routedPercent: 0 },
      });
    } else if (stats.routedPercent < 70) {
      items.push({
        category: 'context_routing',
        severity: 'low',
        type: 'observation',
        title: 'Partial Context Routing',
        detail: `${stats.routedPercent}% of sessions follow Context Routing.`,
        action: null,
        data: { routedCount: routedTotal, totalSessions: stats.totalSessions, routedPercent: stats.routedPercent },
      });
    } else {
      items.push({
        category: 'context_routing',
        severity: 'low',
        type: 'positive',
        title: 'Strong Context Routing',
        detail: `${stats.routedPercent}% of sessions follow Context Routing.`,
        action: null,
        data: { routedCount: routedTotal, totalSessions: stats.totalSessions, routedPercent: stats.routedPercent },
      });
    }
  }

  // Coverage gaps (red directories)
  const redDirs = health.filter(h => h.status === 'red');
  if (redDirs.length > 0) {
    const names = redDirs.slice(0, 5).map(h => h.path);
    items.push({
      category: 'coverage_gap',
      severity: redDirs.length > 5 ? 'high' : redDirs.length > 2 ? 'medium' : 'low',
      type: 'action',
      title: `${redDirs.length} directories missing CLAUDE.md`,
      detail: `Directories without context files: ${names.join(', ')}${redDirs.length > 5 ? ` and ${redDirs.length - 5} more` : ''}.`,
      action: 'Run "go ham" to generate context files, or create them manually.',
      data: { count: redDirs.length, directories: redDirs.map(h => h.path) },
    });
  }

  // Stale context (amber directories)
  const amberDirs = health.filter(h => h.status === 'amber');
  if (amberDirs.length > 0) {
    items.push({
      category: 'stale_context',
      severity: 'medium',
      type: 'action',
      title: `${amberDirs.length} context file${amberDirs.length > 1 ? 's' : ''} may be stale`,
      detail: `Potentially outdated CLAUDE.md files: ${amberDirs.map(h => h.path).join(', ')}.`,
      action: 'Review these files to ensure they reflect current code.',
      data: { count: amberDirs.length, directories: amberDirs.map(h => h.path) },
    });
  }

  // Activity trend
  if (days >= 7) {
    const recentDays = daily.slice(-7);
    const activeDays = recentDays.filter(d => d.sessions > 0).length;
    if (activeDays === 0) {
      items.push({
        category: 'activity',
        severity: 'low',
        type: 'observation',
        title: 'No activity in the last 7 days',
        detail: 'No Claude Code sessions recorded in the past week.',
        action: null,
        data: { activeDays: 0, windowDays: 7 },
      });
    } else if (activeDays >= 5) {
      items.push({
        category: 'activity',
        severity: 'low',
        type: 'positive',
        title: 'Consistent daily usage',
        detail: `Active ${activeDays} of the last 7 days — consistent use keeps cached context warm.`,
        action: null,
        data: { activeDays, windowDays: 7 },
      });
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    days,
    totalSessions: stats.totalSessions,
    items,
  };
}

function fmtTokens(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

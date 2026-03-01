import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// --- Helpers ---

function filterByDays(sessions, days) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return sessions.filter(s => s.startTime && new Date(s.startTime) >= cutoff);
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function readJsonlFile(filePath) {
  if (!existsSync(filePath)) return [];
  try {
    const content = readFileSync(filePath, 'utf-8');
    return content
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try { return JSON.parse(line); }
        catch { return null; }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function pairTaskEntries(entries) {
  const starts = {};
  const tasks = [];

  for (const entry of entries) {
    if (entry.type === 'task_start') {
      starts[entry.id] = entry;
    } else if (entry.type === 'task_end' && starts[entry.id]) {
      const start = starts[entry.id];
      const startTime = new Date(start.timestamp).getTime();
      const endTime = new Date(entry.timestamp).getTime();
      tasks.push({
        id: entry.id,
        description: start.description || '',
        timestamp: start.timestamp,
        endTimestamp: entry.timestamp,
        durationMs: endTime - startTime,
        durationSec: round2((endTime - startTime) / 1000),
        ham_active: start.ham_active ?? true,
        model: start.model || 'unknown',
        files_read: start.files_read || 0,
        memory_files_loaded: start.memory_files_loaded || 0,
        status: entry.status || 'completed',
        estimated_tokens: start.estimated_tokens || 0,
      });
      delete starts[entry.id];
    }
  }

  return tasks;
}

function correlateTokens(task, sessions) {
  const taskStart = new Date(task.timestamp).getTime();
  const taskEnd = new Date(task.endTimestamp).getTime();
  const taskDuration = taskEnd - taskStart;

  if (taskDuration <= 0) return task.estimated_tokens;

  // Find the session that contains this task
  for (const s of sessions) {
    const sessionStart = new Date(s.startTime).getTime();
    const sessionEnd = s.endTime ? new Date(s.endTime).getTime() : sessionStart + (s.durationMs || 0);

    if (taskStart >= sessionStart && taskEnd <= sessionEnd) {
      const sessionDuration = sessionEnd - sessionStart;
      if (sessionDuration <= 0) continue;
      const fraction = taskDuration / sessionDuration;
      const totalTokens = (s.inputTokens || 0) + (s.outputTokens || 0);
      return Math.round(totalTokens * fraction);
    }
  }

  // Fallback to estimated tokens
  return task.estimated_tokens;
}

function getCacheRate(task, sessions) {
  const taskStart = new Date(task.timestamp).getTime();
  const taskEnd = new Date(task.endTimestamp).getTime();

  for (const s of sessions) {
    const sessionStart = new Date(s.startTime).getTime();
    const sessionEnd = s.endTime ? new Date(s.endTime).getTime() : sessionStart + (s.durationMs || 0);

    if (taskStart >= sessionStart && taskEnd <= sessionEnd) {
      const totalInput = s.inputTokens || 0;
      const cacheRead = s.cacheReadTokens || 0;
      if (totalInput <= 0) return 0;
      return round2((cacheRead / totalInput) * 100);
    }
  }

  return 0;
}

// --- Exported functions ---

/**
 * Read benchmark state from .ham/metrics/state.json
 */
export function getBenchmarkState(projectPath) {
  const statePath = join(projectPath, '.ham', 'metrics', 'state.json');
  if (!existsSync(statePath)) {
    return { mode: 'none' };
  }
  try {
    const content = readFileSync(statePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { mode: 'none' };
  }
}

/**
 * Parse a JSONL file and pair task_start/task_end entries by ID.
 */
export function readTaskEntries(projectPath, filename) {
  const filePath = join(projectPath, '.ham', 'metrics', filename);
  const entries = readJsonlFile(filePath);
  return pairTaskEntries(entries);
}

/**
 * Aggregate benchmark summary: total tasks, avg wall clock, avg tokens, avg files read, avg cache rate.
 * Groups by ham_active flag.
 */
export function calculateBenchmarkSummary(projectPath, sessions, days) {
  const filtered = filterByDays(sessions, days);
  const tasks = readTaskEntries(projectPath, 'tasks.jsonl');
  const baselineTasks = readTaskEntries(projectPath, 'baseline.jsonl');
  const allTasks = [...baselineTasks, ...tasks];

  if (allTasks.length === 0) {
    return {
      totalTasks: 0,
      avgWallClockSec: 0,
      avgTokens: 0,
      avgFilesRead: 0,
      avgCacheRate: 0,
      byMode: { baseline: null, active: null },
    };
  }

  // Filter tasks within the time window
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const windowTasks = allTasks.filter(t => new Date(t.timestamp) >= cutoff);

  function summarize(taskList) {
    if (taskList.length === 0) return null;
    const totalDuration = taskList.reduce((sum, t) => sum + t.durationSec, 0);
    const totalTokens = taskList.reduce((sum, t) => sum + correlateTokens(t, filtered), 0);
    const totalFiles = taskList.reduce((sum, t) => sum + t.files_read, 0);
    const totalCache = taskList.reduce((sum, t) => sum + getCacheRate(t, filtered), 0);
    return {
      count: taskList.length,
      avgWallClockSec: round2(totalDuration / taskList.length),
      avgTokens: Math.round(totalTokens / taskList.length),
      avgFilesRead: round2(totalFiles / taskList.length),
      avgCacheRate: round2(totalCache / taskList.length),
    };
  }

  const baselineGroup = windowTasks.filter(t => !t.ham_active);
  const activeGroup = windowTasks.filter(t => t.ham_active);

  const totalDuration = windowTasks.reduce((sum, t) => sum + t.durationSec, 0);
  const totalTokens = windowTasks.reduce((sum, t) => sum + correlateTokens(t, filtered), 0);
  const totalFiles = windowTasks.reduce((sum, t) => sum + t.files_read, 0);
  const totalCache = windowTasks.reduce((sum, t) => sum + getCacheRate(t, filtered), 0);

  return {
    totalTasks: windowTasks.length,
    avgWallClockSec: round2(totalDuration / windowTasks.length),
    avgTokens: Math.round(totalTokens / windowTasks.length),
    avgFilesRead: round2(totalFiles / windowTasks.length),
    avgCacheRate: round2(totalCache / windowTasks.length),
    byMode: {
      baseline: summarize(baselineGroup),
      active: summarize(activeGroup),
    },
  };
}

/**
 * Compare baseline vs HAM performance with per-model breakdown.
 */
export function calculateBenchmarkComparison(projectPath, sessions, days) {
  const filtered = filterByDays(sessions, days);
  const baselineTasks = readTaskEntries(projectPath, 'baseline.jsonl');
  const activeTasks = readTaskEntries(projectPath, 'tasks.jsonl');

  if (baselineTasks.length === 0 && activeTasks.length === 0) {
    return { hasData: false, baseline: null, active: null, comparison: null, byModel: {} };
  }

  function summarizeGroup(taskList) {
    if (taskList.length === 0) return null;
    const totalDuration = taskList.reduce((sum, t) => sum + t.durationSec, 0);
    const totalTokens = taskList.reduce((sum, t) => sum + correlateTokens(t, filtered), 0);
    const totalCache = taskList.reduce((sum, t) => sum + getCacheRate(t, filtered), 0);
    return {
      count: taskList.length,
      avgTimeSec: round2(totalDuration / taskList.length),
      avgTokens: Math.round(totalTokens / taskList.length),
      avgCacheRate: round2(totalCache / taskList.length),
    };
  }

  const baseline = summarizeGroup(baselineTasks);
  const active = summarizeGroup(activeTasks);

  // Compute comparison deltas
  let comparison = null;
  if (baseline && active) {
    const timeDelta = round2(active.avgTimeSec - baseline.avgTimeSec);
    const timePct = baseline.avgTimeSec > 0 ? round2((timeDelta / baseline.avgTimeSec) * 100) : 0;
    const tokenDelta = active.avgTokens - baseline.avgTokens;
    const tokenPct = baseline.avgTokens > 0 ? round2((tokenDelta / baseline.avgTokens) * 100) : 0;
    const cacheDelta = round2(active.avgCacheRate - baseline.avgCacheRate);

    comparison = {
      timeDelta,
      timePct,
      tokenDelta,
      tokenPct,
      cacheDelta,
      estimatedSavings: tokenDelta < 0 ? Math.abs(tokenDelta) * active.count : 0,
    };
  }

  // Per-model breakdown
  const allTasks = [...baselineTasks, ...activeTasks];
  const modelMap = {};
  for (const t of allTasks) {
    const model = t.model || 'unknown';
    if (!modelMap[model]) modelMap[model] = [];
    modelMap[model].push(t);
  }

  const byModel = {};
  for (const [model, tasks] of Object.entries(modelMap)) {
    const modelBaseline = tasks.filter(t => !t.ham_active);
    const modelActive = tasks.filter(t => t.ham_active);
    byModel[model] = {
      total: tasks.length,
      baseline: summarizeGroup(modelBaseline),
      active: summarizeGroup(modelActive),
    };
  }

  return {
    hasData: true,
    baseline,
    active,
    comparison,
    byModel,
  };
}

/**
 * Return last N tasks with correlated token counts.
 */
export function getRecentTasks(projectPath, sessions, limit = 20, days = 30) {
  const filtered = filterByDays(sessions, days);
  const tasks = readTaskEntries(projectPath, 'tasks.jsonl');
  const baselineTasks = readTaskEntries(projectPath, 'baseline.jsonl');
  const allTasks = [...baselineTasks, ...tasks]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);

  return allTasks.map(t => ({
    id: t.id,
    description: t.description,
    timestamp: t.timestamp,
    durationSec: t.durationSec,
    tokens: correlateTokens(t, filtered),
    model: t.model,
    ham_active: t.ham_active,
    files_read: t.files_read,
    cacheRate: getCacheRate(t, filtered),
    status: t.status,
  }));
}

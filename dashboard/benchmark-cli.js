#!/usr/bin/env node
import { parseSessions } from './server/parse-sessions.js';
import { getBenchmarkState, calculateBenchmarkSummary, calculateBenchmarkComparison, getRecentTasks } from './server/benchmark.js';

const args = process.argv.slice(2);
const days = parseInt(args.find((_, i, a) => a[i - 1] === '--days') || '30', 10);
const modelFilter = args.find((_, i, a) => a[i - 1] === '--model') || null;
const showJson = args.includes('--json');
const projectPath = process.cwd();

const sessions = await parseSessions(projectPath);
const state = getBenchmarkState(projectPath);
const summary = calculateBenchmarkSummary(projectPath, sessions, days);
const comparison = calculateBenchmarkComparison(projectPath, sessions, days);

if (showJson) {
  console.log(JSON.stringify({ state, summary, comparison }, null, 2));
  process.exit(0);
}

// --- Formatters ---

function formatDuration(sec) {
  if (sec < 60) return sec.toFixed(1) + 's';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m + 'm ' + s + 's';
}

function formatTokens(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function formatPct(n) {
  const sign = n > 0 ? '+' : '';
  return sign + n.toFixed(1) + '%';
}

function formatChange(value, unit, inverse) {
  // inverse = true means negative is good (e.g. time, tokens)
  const sign = value > 0 ? '+' : '';
  const color = inverse ? (value < 0 ? '↓' : '↑') : (value > 0 ? '↑' : '↓');
  return `${sign}${value}${unit} ${color}`;
}

// --- State check ---

if (state.mode === 'none' && summary.totalTasks === 0) {
  console.log('HAM Benchmark');
  console.log('');
  console.log('No benchmark data found.');
  console.log('');
  console.log('To start benchmarking:');
  console.log('  1. Run "go ham" to set up HAM (auto-initializes baseline)');
  console.log('  2. Or run "ham baseline start" to begin a baseline capture');
  console.log('');
  console.log('The baseline captures 10 tasks without HAM memory loading');
  console.log('for an apples-to-apples comparison.');
  process.exit(0);
}

if (state.mode === 'baseline') {
  const progress = state.tasks_completed || 0;
  const target = state.tasks_target || 10;
  const pct = Math.round((progress / target) * 100);
  const bar = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5));
  console.log('HAM Benchmark — Baseline in Progress');
  console.log('');
  console.log(`  Progress: [${bar}] ${progress}/${target} tasks (${pct}%)`);
  console.log('');
  console.log('  Keep working normally. Baseline tasks skip subdirectory CLAUDE.md');
  console.log('  loading for a clean comparison. After ' + (target - progress) + ' more tasks,');
  console.log('  benchmarking auto-transitions to active mode.');
  console.log('');
  if (progress > 0) {
    const tasks = getRecentTasks(projectPath, sessions, progress, days);
    const baselineTasks = tasks.filter(t => !t.ham_active);
    if (baselineTasks.length > 0) {
      const avgTime = baselineTasks.reduce((s, t) => s + t.durationSec, 0) / baselineTasks.length;
      const avgTokens = baselineTasks.reduce((s, t) => s + t.tokens, 0) / baselineTasks.length;
      console.log(`  Baseline so far: ${formatDuration(avgTime)} avg time, ${formatTokens(Math.round(avgTokens))} avg tokens`);
    }
  }
  process.exit(0);
}

// --- Comparison available ---

console.log('HAM Benchmark Comparison');
console.log(`(last ${days} days)`);
console.log('');

if (!comparison.hasData) {
  console.log('  No task data found in the selected time window.');
  process.exit(0);
}

// Filter by model if requested
if (modelFilter) {
  const modelKey = Object.keys(comparison.byModel).find(k => k.toLowerCase().includes(modelFilter.toLowerCase()));
  if (modelKey && comparison.byModel[modelKey]) {
    const m = comparison.byModel[modelKey];
    console.log(`  Filtered to model: ${modelKey}`);
    console.log('');

    if (m.baseline && m.active) {
      console.log('  ┌──────────────────┬──────────────┬──────────────┬──────────────┐');
      console.log('  │ Metric           │ Baseline     │ HAM Active   │ Change       │');
      console.log('  ├──────────────────┼──────────────┼──────────────┼──────────────┤');
      console.log(`  │ Tasks            │ ${String(m.baseline.count).padEnd(12)} │ ${String(m.active.count).padEnd(12)} │              │`);
      console.log(`  │ Avg Time         │ ${formatDuration(m.baseline.avgTimeSec).padEnd(12)} │ ${formatDuration(m.active.avgTimeSec).padEnd(12)} │ ${formatPct(m.baseline.avgTimeSec > 0 ? ((m.active.avgTimeSec - m.baseline.avgTimeSec) / m.baseline.avgTimeSec) * 100 : 0).padEnd(12)} │`);
      console.log(`  │ Avg Tokens       │ ${formatTokens(m.baseline.avgTokens).padEnd(12)} │ ${formatTokens(m.active.avgTokens).padEnd(12)} │ ${formatPct(m.baseline.avgTokens > 0 ? ((m.active.avgTokens - m.baseline.avgTokens) / m.baseline.avgTokens) * 100 : 0).padEnd(12)} │`);
      console.log(`  │ Avg Cache %      │ ${(m.baseline.avgCacheRate + '%').padEnd(12)} │ ${(m.active.avgCacheRate + '%').padEnd(12)} │ ${formatPct(m.active.avgCacheRate - m.baseline.avgCacheRate).padEnd(12)} │`);
      console.log('  └──────────────────┴──────────────┴──────────────┴──────────────┘');
    } else {
      console.log('  Insufficient data for this model — need both baseline and active tasks.');
    }
    process.exit(0);
  } else {
    console.log(`  No tasks found for model matching "${modelFilter}".`);
    console.log(`  Available models: ${Object.keys(comparison.byModel).join(', ')}`);
    process.exit(0);
  }
}

// Full comparison table
if (comparison.baseline && comparison.active && comparison.comparison) {
  const b = comparison.baseline;
  const a = comparison.active;
  const c = comparison.comparison;

  console.log('  ┌──────────────────┬──────────────┬──────────────┬──────────────┐');
  console.log('  │ Metric           │ Baseline     │ HAM Active   │ Change       │');
  console.log('  ├──────────────────┼──────────────┼──────────────┼──────────────┤');
  console.log(`  │ Tasks            │ ${String(b.count).padEnd(12)} │ ${String(a.count).padEnd(12)} │              │`);
  console.log(`  │ Avg Time         │ ${formatDuration(b.avgTimeSec).padEnd(12)} │ ${formatDuration(a.avgTimeSec).padEnd(12)} │ ${formatPct(c.timePct).padEnd(12)} │`);
  console.log(`  │ Avg Tokens       │ ${formatTokens(b.avgTokens).padEnd(12)} │ ${formatTokens(a.avgTokens).padEnd(12)} │ ${formatPct(c.tokenPct).padEnd(12)} │`);
  console.log(`  │ Avg Cache %      │ ${(b.avgCacheRate + '%').padEnd(12)} │ ${(a.avgCacheRate + '%').padEnd(12)} │ ${formatPct(c.cacheDelta).padEnd(12)} │`);
  console.log('  └──────────────────┴──────────────┴──────────────┴──────────────┘');

  if (c.estimatedSavings > 0) {
    console.log('');
    console.log(`  Estimated token savings: ${formatTokens(c.estimatedSavings)} across ${a.count} active tasks`);
  }
} else if (comparison.baseline && !comparison.active) {
  console.log('  Baseline captured (' + comparison.baseline.count + ' tasks) but no HAM-active tasks yet.');
  console.log('  Keep working with HAM enabled to see the comparison.');
} else if (!comparison.baseline && comparison.active) {
  console.log('  HAM-active tasks found (' + comparison.active.count + ') but no baseline data.');
  console.log('  Run "ham baseline start" to capture a baseline for comparison.');
} else {
  console.log('  No task data available.');
}

// Model breakdown
const models = Object.keys(comparison.byModel);
if (models.length > 1) {
  console.log('');
  console.log('  Per-Model Breakdown:');
  for (const model of models) {
    const m = comparison.byModel[model];
    const shortName = model.replace('claude-', '').split('-').slice(0, 2).join('-');
    const bStr = m.baseline ? `${m.baseline.count} baseline` : 'no baseline';
    const aStr = m.active ? `${m.active.count} active` : 'no active';
    console.log(`    ${shortName}: ${m.total} tasks (${bStr}, ${aStr})`);
  }
}

#!/usr/bin/env node
import { parseSessions } from './server/parse-sessions.js';
import { calculateCarbon, calculateCarbonSessions } from './server/carbon.js';
import { checkContextHealth } from './server/context-health.js';

const args = process.argv.slice(2);
const days = parseInt(args.find((_, i, a) => a[i - 1] === '--days') || '30', 10);
const showLast = args.includes('--last') || args.includes('last');
const showJson = args.includes('--json');
const projectPath = process.cwd();

const sessions = await parseSessions(projectPath);
const health = await checkContextHealth(projectPath, sessions);
const carbon = calculateCarbon(sessions, days, projectPath, health);

if (showJson) {
  if (showLast) {
    const carbonSessions = calculateCarbonSessions(sessions, days, projectPath, health);
    console.log(JSON.stringify(carbonSessions[0] || null, null, 2));
  } else {
    console.log(JSON.stringify(carbon, null, 2));
  }
  process.exit(0);
}

function formatCO2e(grams) {
  if (grams < 1) return '< 1g';
  if (grams < 1000) return Math.round(grams) + 'g';
  return (grams / 1000).toFixed(1) + ' kg';
}

function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateTime(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function formatDuration(ms) {
  if (!ms || ms <= 0) return '-';
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return mins + 'm';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h + 'h ' + m + 'm';
}

function formatTokens(n) {
  return n.toLocaleString();
}

if (showLast) {
  const carbonSessions = calculateCarbonSessions(sessions, days, projectPath, health);
  const last = carbonSessions[0];

  if (!last) {
    console.log('No sessions found.');
    process.exit(0);
  }

  const tokenSaved = Math.max(0, last.baselineTokens - last.inputTokens);
  const avgActual = last.prompts > 0 ? Math.round(last.inputTokens / last.prompts) : 0;
  const avgBaseline = last.prompts > 0 ? Math.round(last.baselineTokens / last.prompts) : 0;

  console.log(`HAM Efficiency | Session ${formatDateTime(last.startTime)}`);
  console.log(`Duration:       ${formatDuration(last.durationMs)}  |  ${last.prompts} prompts`);
  console.log(`Tokens loaded:  ${formatTokens(last.inputTokens)}   (avg ${formatTokens(avgActual)}/req)`);
  console.log(`Baseline est:   ${formatTokens(last.baselineTokens)}  (avg ${formatTokens(avgBaseline)}/req)`);
  console.log(`Token savings:  ${last.tokenSavingsPercent.toFixed(1)}%`);
  console.log(`Energy saved:   ~${Math.round(last.saved_wh)} Wh`);
  console.log(`CO2e saved:     ~${formatCO2e(Math.max(0, last.saved_grams))}`);

  if (last.filesLoaded && last.filesLoaded.length > 0) {
    console.log('');
    console.log('Files loaded this session:');
    for (const f of last.filesLoaded) {
      const tokStr = f.tokens > 0 ? `${f.tokens} tokens` : '';
      console.log(`  ${f.path.padEnd(30)} ${tokStr}  (${f.loadCount}x)`);
    }
  }
} else {
  // Default: quick summary
  const todaySessions = sessions.filter(s => {
    if (!s.startTime) return false;
    const d = new Date(s.startTime);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const todayHealth = await checkContextHealth(projectPath, todaySessions);
  const todayCarbon = calculateCarbon(todaySessions, 1, projectPath, health);

  const carbonSessions = calculateCarbonSessions(sessions, days, projectPath, health);
  const last = carbonSessions[0];

  console.log('HAM Efficiency');
  console.log(`Total saved:    ${formatCO2e(Math.max(0, carbon.totalCO2e.saved_grams))} CO2e (since ${formatDate(carbon.trackingSince)})`);
  console.log(`Today:          ${formatCO2e(Math.max(0, todayCarbon.totalCO2e.saved_grams))} saved  |  ${todayCarbon.totalSessions} sessions`);

  if (last) {
    console.log(`Last session:   ${formatCO2e(Math.max(0, last.saved_grams))} saved  |  ${last.prompts} prompts  |  ${last.tokenSavingsPercent.toFixed(0)}% token reduction`);
  }
}

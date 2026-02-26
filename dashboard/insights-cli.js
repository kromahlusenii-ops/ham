#!/usr/bin/env node
import { parseSessions } from './server/parse-sessions.js';
import { calculateStats, calculateDaily } from './server/calculate-stats.js';
import { checkContextHealth } from './server/context-health.js';
import { generateStructuredInsights } from './server/insights.js';

const days = parseInt(process.argv.find((_, i, a) => a[i - 1] === '--days') || '30', 10);
const projectPath = process.cwd();

const sessions = await parseSessions(projectPath);
const stats = calculateStats(sessions, days);
const health = await checkContextHealth(projectPath, sessions);
const daily = calculateDaily(sessions, days);

console.log(JSON.stringify(generateStructuredInsights(stats, health, daily, days), null, 2));

import { createServer } from 'http';
import { readFile, readFile as readFileAsync } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { parseSessions } from './parse-sessions.js';
import { calculateStats, calculateDaily, calculateDirectories } from './calculate-stats.js';
import { checkContextHealth } from './context-health.js';
import { generateInsights, generateStructuredInsights } from './insights.js';
import { calculateCarbon, calculateCarbonDaily, calculateCarbonSessions, calculateCarbonFiles } from './carbon.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DIST_DIR = join(__dirname, '..', 'dist');
const SKILL_MD_PATH = join(__dirname, '..', '..', 'SKILL.md');

// Read ham_version from SKILL.md frontmatter
let hamVersion = '0.0.0';
try {
  const skillContent = await readFileAsync(SKILL_MD_PATH, 'utf-8');
  const match = skillContent.match(/^ham_version:\s*"(.+)"/m);
  if (match) hamVersion = match[1];
} catch {
  // SKILL.md not found — use fallback
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

let cachedSessions = [];
let projectPath = '';

/**
 * Start the dashboard server.
 */
export async function startServer(port = 7777) {
  projectPath = process.cwd();
  console.log(`\n  HAM Dashboard`);
  console.log(`  Project: ${projectPath}`);
  console.log(`  Parsing session data...`);

  try {
    cachedSessions = await parseSessions(projectPath);
    console.log(`  Found ${cachedSessions.length} sessions\n`);
  } catch (err) {
    console.error(`  Error parsing sessions: ${err.message}`);
    cachedSessions = [];
  }

  const server = createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`);
    const pathname = url.pathname;

    // API routes
    if (pathname.startsWith('/api/')) {
      return handleApi(pathname, url.searchParams, res);
    }

    // Static file serving
    return serveStatic(pathname, res);
  });

  server.listen(port, () => {
    console.log(`  Dashboard running at http://localhost:${port}\n`);
    console.log(`  Press Ctrl+C to stop\n`);
  });
}

async function handleApi(pathname, params, res) {
  const days = parseInt(params.get('days') || '30', 10);
  const limit = parseInt(params.get('limit') || '50', 10);

  res.setHeader('Content-Type', 'application/json');

  try {
    let data;

    switch (pathname) {
      case '/api/stats':
        data = calculateStats(cachedSessions, days);
        data.projectName = projectPath.split('/').pop();
        data.hamVersion = hamVersion;
        break;

      case '/api/daily':
        data = calculateDaily(cachedSessions, days);
        break;

      case '/api/directories':
        data = calculateDirectories(cachedSessions, days);
        break;

      case '/api/sessions': {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        data = cachedSessions
          .filter(s => s.startTime && new Date(s.startTime) >= cutoff)
          .slice(0, limit)
          .map(s => ({
            sessionId: s.sessionId,
            startTime: s.startTime,
            endTime: s.endTime,
            durationMs: s.durationMs,
            model: s.model,
            inputTokens: s.inputTokens,
            outputTokens: s.outputTokens,
            cacheReadTokens: s.cacheReadTokens,
            fileReads: s.fileReads.length,
            isHamOn: s.isHamOn,
            routingStatus: s.routingStatus,
            primaryDirectory: s.primaryDirectory,
            messageCount: s.messageCount,
            toolCallCount: s.toolCallCount,
          }));
        break;
      }

      case '/api/health':
        data = await checkContextHealth(projectPath, cachedSessions);
        break;

      case '/api/insights': {
        const stats = calculateStats(cachedSessions, days);
        const health = await checkContextHealth(projectPath, cachedSessions);
        const daily = calculateDaily(cachedSessions, days);
        data = generateInsights(stats, health, daily, days);
        break;
      }

      case '/api/insights/structured': {
        const sStats = calculateStats(cachedSessions, days);
        const sHealth = await checkContextHealth(projectPath, cachedSessions);
        const sDaily = calculateDaily(cachedSessions, days);
        data = generateStructuredInsights(sStats, sHealth, sDaily, days);
        break;
      }

      case '/api/carbon': {
        const carbonHealth = await checkContextHealth(projectPath, cachedSessions);
        data = calculateCarbon(cachedSessions, days, projectPath, carbonHealth);
        break;
      }

      case '/api/carbon/daily': {
        const cdHealth = await checkContextHealth(projectPath, cachedSessions);
        data = calculateCarbonDaily(cachedSessions, days, projectPath, cdHealth);
        break;
      }

      case '/api/carbon/sessions': {
        const csHealth = await checkContextHealth(projectPath, cachedSessions);
        data = calculateCarbonSessions(cachedSessions, days, projectPath, csHealth);
        break;
      }

      case '/api/carbon/files': {
        const cfHealth = await checkContextHealth(projectPath, cachedSessions);
        data = calculateCarbonFiles(cachedSessions, days, projectPath, cfHealth);
        break;
      }

      case '/api/refresh':
        console.log('  Refreshing session data...');
        cachedSessions = await parseSessions(projectPath);
        console.log(`  Found ${cachedSessions.length} sessions`);
        data = { refreshed: true, sessionCount: cachedSessions.length };
        break;

      default:
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
        return;
    }

    res.writeHead(200);
    res.end(JSON.stringify(data));
  } catch (err) {
    console.error(`API error (${pathname}):`, err);
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
  }
}

async function serveStatic(pathname, res) {
  if (pathname === '/') pathname = '/index.html';

  const filePath = join(DIST_DIR, pathname);

  try {
    const content = await readFile(filePath);
    const ext = extname(filePath);
    res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
    res.writeHead(200);
    res.end(content);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // SPA fallback: serve index.html for non-file routes
      try {
        const index = await readFile(join(DIST_DIR, 'index.html'));
        res.setHeader('Content-Type', 'text/html');
        res.writeHead(200);
        res.end(index);
      } catch {
        res.writeHead(404);
        res.end('Dashboard not built. Run: cd dashboard && npm run build');
      }
    } else {
      res.writeHead(500);
      res.end('Server error');
    }
  }
}

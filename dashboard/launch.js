#!/usr/bin/env node

/**
 * One-command launcher for HAM Dashboard.
 * Handles install, build, and start automatically.
 *
 * Usage: node dashboard/launch.js [--port 8080]
 */

import { existsSync, statSync, readdirSync, readFileSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
let port = 7777;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' && args[i + 1]) {
    port = parseInt(args[i + 1], 10);
    if (isNaN(port)) {
      console.error('Invalid port number:', args[i + 1]);
      process.exit(1);
    }
  }
}

function run(cmd) {
  execSync(cmd, { cwd: __dirname, stdio: 'inherit' });
}

function isSourceNewer(dir, benchmarkMs) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (isSourceNewer(fullPath, benchmarkMs)) return true;
    } else {
      if (statSync(fullPath).mtimeMs > benchmarkMs) return true;
    }
  }
  return false;
}

// Check for updates (non-blocking, skips if offline or not a git repo)
const repoDir = join(__dirname, '..');
try {
  execSync('git fetch origin --quiet', { cwd: repoDir, timeout: 5000, stdio: 'ignore' });
  const local = execSync('git rev-parse HEAD', { cwd: repoDir, encoding: 'utf-8' }).trim();
  const remote = execSync('git rev-parse origin/main', { cwd: repoDir, encoding: 'utf-8' }).trim();
  if (local !== remote) {
    // Read local version from SKILL.md
    const skillPath = join(repoDir, 'SKILL.md');
    const localSkill = readFileSync(skillPath, 'utf-8');
    const localMatch = localSkill.match(/^ham_version:\s*"(.+)"/m);
    const localVersion = localMatch ? localMatch[1] : 'unknown';

    // Read remote version from SKILL.md on origin/main
    let remoteVersion = 'unknown';
    try {
      const remoteSkill = execSync('git show origin/main:SKILL.md', { cwd: repoDir, encoding: 'utf-8' });
      const remoteMatch = remoteSkill.match(/^ham_version:\s*"(.+)"/m);
      if (remoteMatch) remoteVersion = remoteMatch[1];
    } catch {
      // Couldn't read remote SKILL.md — fall through with 'unknown'
    }

    console.log(`\n  Update available! You're on v${localVersion}. Latest is v${remoteVersion}.`);
    console.log(`  Run: ham update\n`);
  }
} catch {
  // Offline, not a git repo, or no remote — skip silently
}

// Auto-install if needed
if (!existsSync(join(__dirname, 'node_modules'))) {
  console.log('  Installing dependencies...\n');
  run('npm install');
  console.log('');
}

// Auto-build if needed (rebuild when source is newer than dist)
const distPath = join(__dirname, 'dist', 'index.html');
let needsBuild = !existsSync(distPath);

if (!needsBuild) {
  const distMtime = statSync(distPath).mtimeMs;
  const srcDir = join(__dirname, 'src');
  needsBuild = isSourceNewer(srcDir, distMtime);
}

if (needsBuild) {
  console.log('  Building frontend...\n');
  run('npm run build');
  console.log('');
}

// Start the server
const { startServer } = await import('./server/index.js');
startServer(port);

#!/usr/bin/env node

/**
 * One-command launcher for HAM Dashboard.
 * Handles install, build, and start automatically.
 *
 * Usage: node dashboard/launch.js [--port 8080]
 */

import { existsSync } from 'fs';
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

// Auto-install if needed
if (!existsSync(join(__dirname, 'node_modules'))) {
  console.log('  Installing dependencies...\n');
  run('npm install');
  console.log('');
}

// Auto-build if needed
if (!existsSync(join(__dirname, 'dist', 'index.html'))) {
  console.log('  Building frontend...\n');
  run('npm run build');
  console.log('');
}

// Start the server
const { startServer } = await import('./server/index.js');
startServer(port);

#!/usr/bin/env node

import { startServer } from './server/index.js';

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

startServer(port);

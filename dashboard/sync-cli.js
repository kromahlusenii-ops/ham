#!/usr/bin/env node
import { syncSessions } from './server/sync-parser.js';

const args = process.argv.slice(2);
const force = args.includes('--force');
const verbose = args.includes('--verbose');
const showJson = args.includes('--json');
const projectPath = process.cwd();

const result = await syncSessions(projectPath, { force, verbose });

if (showJson) {
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

console.log('HAM Sync');
console.log(`  Added:   ${result.added} sessions`);
console.log(`  Updated: ${result.updated} sessions`);
console.log(`  Skipped: ${result.skipped} (unchanged)`);
console.log(`  Total:   ${result.totalSessions} sessions`);
console.log(`  Time:    ${result.durationMs}ms`);
if (result.errors.length > 0) {
  console.log(`  Errors:  ${result.errors.length}`);
  for (const e of result.errors) console.warn(`    ${e}`);
}

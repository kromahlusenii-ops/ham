import { readFile, writeFile, rename, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { randomBytes } from 'crypto';

const SYNC_STATE_FILE = 'sync_state.json';
const SESSIONS_FILE = 'sessions.jsonl';

function metricsDir(projectPath) {
  return join(projectPath, '.ham', 'metrics');
}

/**
 * Read the sync state file. Returns default state if missing or corrupted.
 */
export async function readSyncState(projectPath) {
  const filePath = join(metricsDir(projectPath), SYNC_STATE_FILE);
  try {
    const data = await readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {
      adapter: 'claude_code',
      last_sync: null,
      processed_files: {},
    };
  }
}

/**
 * Write the sync state file atomically (write-to-temp-then-rename).
 */
export async function writeSyncState(projectPath, state) {
  const dir = metricsDir(projectPath);
  await mkdir(dir, { recursive: true });
  const filePath = join(dir, SYNC_STATE_FILE);
  const tmpPath = filePath + '.' + randomBytes(4).toString('hex') + '.tmp';
  await writeFile(tmpPath, JSON.stringify(state, null, 2));
  await rename(tmpPath, filePath);
}

/**
 * Read existing synced sessions as a Map keyed by session_id.
 */
export async function readExistingSessions(projectPath) {
  const filePath = join(metricsDir(projectPath), SESSIONS_FILE);
  const map = new Map();
  try {
    const data = await readFile(filePath, 'utf-8');
    for (const line of data.split('\n')) {
      if (!line.trim()) continue;
      try {
        const record = JSON.parse(line);
        if (record.session_id) {
          map.set(record.session_id, record);
        }
      } catch {
        // skip malformed lines
      }
    }
  } catch {
    // file doesn't exist yet
  }
  return map;
}

/**
 * Append new session records to sessions.jsonl.
 */
export async function appendSessions(projectPath, records) {
  if (records.length === 0) return;
  const dir = metricsDir(projectPath);
  await mkdir(dir, { recursive: true });
  const filePath = join(dir, SESSIONS_FILE);
  const lines = records.map(r => JSON.stringify(r)).join('\n') + '\n';
  await writeFile(filePath, lines, { flag: 'a' });
}

/**
 * Full rewrite of sessions.jsonl (used when updating existing records).
 */
export async function rewriteSessions(projectPath, allRecords) {
  const dir = metricsDir(projectPath);
  await mkdir(dir, { recursive: true });
  const filePath = join(dir, SESSIONS_FILE);
  const tmpPath = filePath + '.' + randomBytes(4).toString('hex') + '.tmp';
  const lines = allRecords.map(r => JSON.stringify(r)).join('\n') + '\n';
  await writeFile(tmpPath, lines);
  await rename(tmpPath, filePath);
}

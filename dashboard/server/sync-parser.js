import { readdir, stat } from 'fs/promises';
import { readFileSync, existsSync } from 'fs';
import { join, basename } from 'path';
import { getProjectSessionDir, calculateCost } from './utils.js';
import { parseSessionFile } from './session-core.js';
import {
  readSyncState,
  writeSyncState,
  readExistingSessions,
  appendSessions,
  rewriteSessions,
} from './sync-state.js';

const ACTIVE_SESSION_GUARD_MS = 60_000;

/**
 * Sync Claude Code session JSONL files into .ham/metrics/sessions.jsonl.
 */
export async function syncSessions(projectPath, options = {}) {
  const startMs = Date.now();
  const result = { added: 0, updated: 0, skipped: 0, errors: [], totalSessions: 0, durationMs: 0 };

  const sessionDir = getProjectSessionDir(projectPath);

  // Check if Claude Code session directory exists
  let files;
  try {
    const entries = await readdir(sessionDir);
    files = entries.filter(f => f.endsWith('.jsonl'));
  } catch (err) {
    if (err.code === 'ENOENT') {
      result.errors.push('Claude Code not detected — no session directory found');
      result.durationMs = Date.now() - startMs;
      return result;
    }
    throw err;
  }

  if (files.length === 0) {
    result.durationMs = Date.now() - startMs;
    return result;
  }

  // Load sync state and existing sessions
  const syncState = options.force
    ? { adapter: 'claude_code', last_sync: null, processed_files: {} }
    : await readSyncState(projectPath);
  const existingSessions = await readExistingSessions(projectPath);

  // Check if root CLAUDE.md has Agent Memory System
  const rootHasAgentMemory = checkRootAgentMemory(projectPath);
  const hamDirExists = existsSync(join(projectPath, '.ham'));
  const now = Date.now();

  const newRecords = [];
  const updatedRecords = [];

  for (const file of files) {
    const filePath = join(sessionDir, file);

    try {
      const fileStat = await stat(filePath);
      const mtime = fileStat.mtimeMs;
      const size = fileStat.size;

      // Active session guard: skip files modified within the last 60 seconds
      if (!options.force && (now - mtime) < ACTIVE_SESSION_GUARD_MS) {
        result.skipped++;
        if (options.verbose) console.log(`  Skip (active): ${file}`);
        continue;
      }

      // Incremental: skip if mtime and size unchanged
      const prev = syncState.processed_files[file];
      if (!options.force && prev && prev.mtime === mtime && prev.size === size) {
        result.skipped++;
        continue;
      }

      // Parse the session file
      const raw = await parseSessionFile(filePath, projectPath);

      if (!raw.sessionId) {
        result.skipped++;
        if (options.verbose) console.log(`  Skip (no sessionId): ${file}`);
        syncState.processed_files[file] = { mtime, size };
        continue;
      }

      // Continuation detection: if sessionId differs from filenameId, skip
      if (raw.sessionId !== raw.filenameId) {
        result.skipped++;
        if (options.verbose) console.log(`  Skip (continuation): ${file}`);
        syncState.processed_files[file] = { mtime, size };
        continue;
      }

      // Sub-agent detection
      const isSubAgent = file.startsWith('agent-');

      // Cohort classification
      const cohort = classifyCohort(raw, hamDirExists, rootHasAgentMemory);

      // Detect HAM file reads
      const hamFilesRead = raw.fileReads.filter(
        fp => fp.includes('.ham/') || fp.includes('.memory/') || basename(fp) === 'CLAUDE.md'
      );

      // Calculate cost with all 4 token fields
      const cost = calculateCost(
        raw.inputTokens,
        raw.outputTokens,
        raw.model,
        raw.cacheReadTokens,
        raw.cacheCreationTokens,
      );

      // Build normalized record
      const record = {
        session_id: raw.sessionId,
        agent: 'claude_code',
        repo_root: projectPath,
        started_at: raw.startTime,
        ended_at: raw.endTime,
        duration_seconds: Math.round(raw.durationMs / 1000),
        input_tokens: raw.inputTokens,
        output_tokens: raw.outputTokens,
        cache_read_tokens: raw.cacheReadTokens,
        cache_write_tokens: raw.cacheCreationTokens,
        model: raw.model,
        cost_estimate_usd: Math.round(cost * 100) / 100,
        ham_context_loaded: raw.rootClaudeMdRead,
        ham_files_read: hamFilesRead,
        cohort,
        tool_calls: raw.toolCallCount,
        files_read: raw.fileReads.length,
        files_written: raw.fileWrites.length,
        git_branch: raw.gitBranch,
        claude_code_version: raw.version,
        is_sub_agent: isSubAgent,
        synced_at: new Date().toISOString(),
        source_file: filePath,
      };

      // Merge: add new or replace updated
      if (existingSessions.has(raw.sessionId)) {
        existingSessions.set(raw.sessionId, record);
        updatedRecords.push(record);
        result.updated++;
      } else {
        existingSessions.set(raw.sessionId, record);
        newRecords.push(record);
        result.added++;
      }

      // Update processed files state
      syncState.processed_files[file] = { mtime, size };

      if (options.verbose) {
        console.log(`  Synced: ${file} (${raw.inputTokens + raw.outputTokens} tokens, ${cohort})`);
      }
    } catch (err) {
      result.errors.push(`${file}: ${err.message}`);
    }
  }

  // Write results
  if (updatedRecords.length > 0) {
    // Full rewrite needed when records are updated
    await rewriteSessions(projectPath, Array.from(existingSessions.values()));
  } else if (newRecords.length > 0) {
    await appendSessions(projectPath, newRecords);
  }

  // Update sync state
  syncState.last_sync = new Date().toISOString();
  await writeSyncState(projectPath, syncState);

  result.totalSessions = existingSessions.size;
  result.durationMs = Date.now() - startMs;
  return result;
}

/**
 * Classify session cohort: ham_on, ham_off, or pre_ham.
 */
function classifyCohort(raw, hamDirExists, rootHasAgentMemory) {
  if (raw.rootClaudeMdRead && raw.subdirClaudeMdRead && rootHasAgentMemory) {
    return 'ham_on';
  }
  if (hamDirExists) {
    return 'ham_off';
  }
  return 'pre_ham';
}

/**
 * Check if root CLAUDE.md contains the Agent Memory System section.
 */
function checkRootAgentMemory(projectPath) {
  try {
    const content = readFileSync(join(projectPath, 'CLAUDE.md'), 'utf-8');
    return content.includes('## Agent Memory System');
  } catch {
    return false;
  }
}

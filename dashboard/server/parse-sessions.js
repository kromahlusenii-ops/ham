import { readdir } from 'fs/promises';
import { readFileSync } from 'fs';
import { join, basename, dirname, relative } from 'path';
import { getProjectSessionDir } from './utils.js';
import { parseSessionFile } from './session-core.js';

/**
 * Parse all session JSONL files for a given project path.
 * Returns an array of session objects.
 */
export async function parseSessions(projectPath) {
  const sessionDir = getProjectSessionDir(projectPath);
  const { paths: routingPaths, content: rootClaudeMdContent } = extractRoutingPaths(projectPath);
  const rootHasAgentMemory = rootClaudeMdContent.includes('## Agent Memory System');

  let files;
  try {
    const entries = await readdir(sessionDir);
    files = entries.filter(f => f.endsWith('.jsonl'));
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.warn(`No session directory found at ${sessionDir}`);
      return [];
    }
    throw err;
  }

  const sessions = [];

  for (const file of files) {
    const filePath = join(sessionDir, file);
    try {
      const session = await parseOneSession(filePath, projectPath, routingPaths, rootHasAgentMemory);
      if (session && session.sessionId) {
        sessions.push(session);
      }
    } catch (err) {
      console.warn(`Skipping ${file}: ${err.message}`);
    }
  }

  return sessions.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
}

/**
 * Parse a single JSONL file into a session object.
 * Layers dashboard-specific logic (routing, turns, primaryDirectory) on top of session-core.
 */
async function parseOneSession(filePath, projectPath, routingPaths, rootHasAgentMemory) {
  const raw = await parseSessionFile(filePath, projectPath);

  // Build dashboard-specific session object
  const session = {
    sessionId: raw.sessionId,
    startTime: raw.startTime,
    endTime: raw.endTime,
    durationMs: raw.durationMs,
    model: raw.model,
    inputTokens: raw.inputTokens,
    outputTokens: raw.outputTokens,
    cacheReadTokens: raw.cacheReadTokens,
    cacheCreationTokens: raw.cacheCreationTokens,
    fileReads: raw.fileReads,
    claudeMdReads: raw.claudeMdReads,
    isHamOn: false,
    rootClaudeMdRead: raw.rootClaudeMdRead,
    subdirClaudeMdRead: raw.subdirClaudeMdRead,
    routingStatus: 'unrouted',
    primaryDirectory: null,
    messageCount: raw.messageCount,
    toolCallCount: raw.toolCallCount,
    turns: [],  // turns are not reconstructed from session-core (dashboard calculates separately if needed)
  };

  // Attribute primary directory
  session.primaryDirectory = attributeDirectory(session.fileReads, projectPath);

  // HAM-on: requires both root and subdir CLAUDE.md reads, plus root has Agent Memory System
  session.isHamOn = session.rootClaudeMdRead && session.subdirClaudeMdRead && rootHasAgentMemory;

  // Determine routing status
  session.routingStatus = determineRoutingStatus(session, projectPath, routingPaths);

  return session;
}

/**
 * Determine which directory a session is primarily working in
 * by counting file reads per directory (excluding CLAUDE.md reads).
 */
function attributeDirectory(fileReads, projectPath) {
  const counts = {};

  for (const fp of fileReads) {
    if (basename(fp) === 'CLAUDE.md') continue;

    const dir = dirname(fp);
    const rel = relative(projectPath, dir) || '.';
    if (rel.startsWith('..')) continue; // outside project

    counts[rel] = (counts[rel] || 0) + 1;
  }

  let maxDir = null;
  let maxCount = 0;
  for (const [dir, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      maxDir = dir;
    }
  }

  return maxDir;
}

/**
 * Extract routing paths from the root CLAUDE.md's "## Context Routing" section.
 * Returns { paths: string[], content: string } where content is the raw root CLAUDE.md.
 */
function extractRoutingPaths(projectPath) {
  const claudeMdPath = join(projectPath, 'CLAUDE.md');
  let content;
  try {
    content = readFileSync(claudeMdPath, 'utf-8');
  } catch {
    return { paths: [], content: '' };
  }

  const lines = content.split('\n');
  let inSection = false;
  const paths = [];

  for (const line of lines) {
    if (line.startsWith('## Context Routing')) {
      inSection = true;
      continue;
    }
    if (inSection && line.startsWith('## ')) {
      break; // hit the next section
    }
    if (inSection) {
      // Match lines like: → label: path/to/CLAUDE.md
      const match = line.match(/^→\s+\w+:\s+(.+)$/);
      if (match) {
        paths.push(join(projectPath, match[1].trim()));
      }
    }
  }

  return { paths, content };
}

/**
 * Determine whether a session followed the context routing map.
 * - 'routed': root CLAUDE.md read, then a listed sub-context immediately after
 * - 'likely': root read, and a listed sub-context appears later (not immediately after)
 * - 'unrouted': root not read, or no listed sub-context found
 */
function determineRoutingStatus(session, projectPath, routingPaths) {
  if (routingPaths.length === 0) return 'unrouted';

  const reads = session.claudeMdReads;
  const rootPath = join(projectPath, 'CLAUDE.md');
  const rootIndex = reads.indexOf(rootPath);

  if (rootIndex === -1) return 'unrouted';

  // Check if the immediate next CLAUDE.md read is a routing target
  if (rootIndex + 1 < reads.length && routingPaths.includes(reads[rootIndex + 1])) {
    return 'routed';
  }

  // Check if any later read is a routing target
  for (let i = rootIndex + 1; i < reads.length; i++) {
    if (routingPaths.includes(reads[i])) {
      return 'likely';
    }
  }

  return 'unrouted';
}

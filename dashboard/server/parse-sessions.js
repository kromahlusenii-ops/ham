import { readdir, stat } from 'fs/promises';
import { createReadStream, readFileSync } from 'fs';
import { createInterface } from 'readline';
import { join, basename, dirname, relative } from 'path';
import { getProjectSessionDir } from './utils.js';

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
 */
async function parseOneSession(filePath, projectPath, routingPaths, rootHasAgentMemory) {
  const session = {
    sessionId: null,
    startTime: null,
    endTime: null,
    durationMs: 0,
    model: null,
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheCreationTokens: 0,
    fileReads: [],        // all file paths read
    claudeMdReads: [],    // CLAUDE.md reads specifically
    isHamOn: false,
    rootClaudeMdRead: false,
    subdirClaudeMdRead: false,
    routingStatus: 'unrouted',
    primaryDirectory: null,
    messageCount: 0,
    toolCallCount: 0,
    turns: [],
  };

  let currentTurn = null;

  const rl = createInterface({
    input: createReadStream(filePath),
    crlfDelay: Infinity,
  });

  const timestamps = [];

  for await (const line of rl) {
    if (!line.trim()) continue;

    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue; // skip malformed lines
    }

    // Extract sessionId from user entries
    if (entry.sessionId && !session.sessionId) {
      session.sessionId = entry.sessionId;
    }

    // Collect timestamps from any entry that has one
    const ts = entry.timestamp || entry.message?.timestamp;
    if (ts) {
      timestamps.push(ts);
    }

    const msg = entry.message;
    if (!msg) continue;

    // Process assistant messages
    if (msg.role === 'assistant') {
      session.messageCount++;

      // Token usage
      const usage = msg.usage;
      if (usage) {
        const inTok = usage.input_tokens || 0;
        const outTok = usage.output_tokens || 0;
        const cacheRead = usage.cache_read_input_tokens || 0;
        session.inputTokens += inTok;
        session.outputTokens += outTok;
        session.cacheReadTokens += cacheRead;
        session.cacheCreationTokens += usage.cache_creation_input_tokens || 0;

        if (currentTurn) {
          currentTurn.inputTokens += inTok;
          currentTurn.outputTokens += outTok;
          currentTurn.cacheReadTokens += cacheRead;
        }
      }

      // Model detection
      if (msg.model && !session.model) {
        session.model = msg.model;
      }

      // Tool use extraction
      const contents = msg.content;
      if (Array.isArray(contents)) {
        for (const block of contents) {
          if (block.type === 'tool_use') {
            session.toolCallCount++;
            if (currentTurn) currentTurn.toolCalls++;

            if (block.name === 'Read' && block.input?.file_path) {
              const fp = block.input.file_path;
              session.fileReads.push(fp);
              if (currentTurn) currentTurn.fileReads.push(fp);

              // Check if it's a CLAUDE.md read
              if (basename(fp) === 'CLAUDE.md') {
                session.claudeMdReads.push(fp);

                const rel = relative(projectPath, fp);
                if (rel === 'CLAUDE.md') {
                  session.rootClaudeMdRead = true;
                } else if (rel && !rel.startsWith('..')) {
                  session.subdirClaudeMdRead = true;
                }
              }
            }
          }
        }
      }
    }

    // Also count user messages and track turns
    if (msg.role === 'user') {
      session.messageCount++;
      // Push previous turn (if it has assistant data) and start a new one
      if (currentTurn && currentTurn.inputTokens > 0) {
        session.turns.push(currentTurn);
      }
      currentTurn = {
        turnIndex: session.turns.length,
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        fileReads: [],
        toolCalls: 0,
      };
    }
  }

  // Push the final turn
  if (currentTurn && currentTurn.inputTokens > 0) {
    session.turns.push(currentTurn);
  }

  // Calculate timestamps
  if (timestamps.length > 0) {
    timestamps.sort();
    session.startTime = timestamps[0];
    session.endTime = timestamps[timestamps.length - 1];
    session.durationMs = new Date(session.endTime) - new Date(session.startTime);
  }

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
 * Cached per parseSessions() invocation.
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
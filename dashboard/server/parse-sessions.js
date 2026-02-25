import { readdir, stat } from 'fs/promises';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { join, basename, dirname, relative } from 'path';
import { getProjectSessionDir } from './utils.js';

/**
 * Parse all session JSONL files for a given project path.
 * Returns an array of session objects.
 */
export async function parseSessions(projectPath) {
  const sessionDir = getProjectSessionDir(projectPath);

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
      const session = await parseOneSession(filePath, projectPath);
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
async function parseOneSession(filePath, projectPath) {
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
    primaryDirectory: null,
    messageCount: 0,
    toolCallCount: 0,
  };

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
        session.inputTokens += usage.input_tokens || 0;
        session.outputTokens += usage.output_tokens || 0;
        session.cacheReadTokens += usage.cache_read_input_tokens || 0;
        session.cacheCreationTokens += usage.cache_creation_input_tokens || 0;
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

            if (block.name === 'Read' && block.input?.file_path) {
              const fp = block.input.file_path;
              session.fileReads.push(fp);

              // Check if it's a CLAUDE.md read
              if (basename(fp) === 'CLAUDE.md') {
                session.claudeMdReads.push(fp);

                // HAM-on: CLAUDE.md in project tree but NOT the root one
                const rel = relative(projectPath, fp);
                if (rel && !rel.startsWith('..') && rel !== 'CLAUDE.md') {
                  session.isHamOn = true;
                }
              }
            }
          }
        }
      }
    }

    // Also count user messages
    if (msg.role === 'user') {
      session.messageCount++;
    }
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

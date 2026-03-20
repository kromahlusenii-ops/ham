import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { basename, dirname, relative } from 'path';

/**
 * Parse a single JSONL session file into a RawSession object.
 * Shared core used by both the dashboard (parse-sessions.js) and ham sync (sync-parser.js).
 */
export async function parseSessionFile(filePath, projectPath) {
  const raw = {
    sessionId: null,
    filenameId: basename(filePath, '.jsonl'),
    startTime: null,
    endTime: null,
    durationMs: 0,
    model: null,
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheCreationTokens: 0,
    messageCount: 0,
    toolCallCount: 0,
    fileReads: [],
    fileWrites: [],
    claudeMdReads: [],
    rootClaudeMdRead: false,
    subdirClaudeMdRead: false,
    gitBranch: null,
    version: null,
    toolNames: {},
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

    // Extract sessionId from first entry that has one
    if (entry.sessionId && !raw.sessionId) {
      raw.sessionId = entry.sessionId;
    }

    // Collect timestamps
    const ts = entry.timestamp || entry.message?.timestamp;
    if (ts) {
      timestamps.push(ts);
    }

    const msg = entry.message;
    if (!msg) continue;

    // Extract git branch and version from user entries
    if (msg.role === 'user') {
      raw.messageCount++;
      if (!raw.gitBranch && entry.gitBranch) {
        raw.gitBranch = entry.gitBranch;
      }
      if (!raw.version && entry.claude_code_version) {
        raw.version = entry.claude_code_version;
      }
    }

    // Process assistant messages
    if (msg.role === 'assistant') {
      raw.messageCount++;

      // Token usage
      const usage = msg.usage;
      if (usage) {
        raw.inputTokens += usage.input_tokens || 0;
        raw.outputTokens += usage.output_tokens || 0;
        raw.cacheReadTokens += usage.cache_read_input_tokens || 0;
        raw.cacheCreationTokens += usage.cache_creation_input_tokens || 0;
      }

      // Model detection
      if (msg.model && !raw.model) {
        raw.model = msg.model;
      }

      // Tool use extraction
      const contents = msg.content;
      if (Array.isArray(contents)) {
        for (const block of contents) {
          if (block.type === 'tool_use') {
            raw.toolCallCount++;
            raw.toolNames[block.name] = (raw.toolNames[block.name] || 0) + 1;

            const fp = block.input?.file_path;

            if (block.name === 'Read' && fp) {
              raw.fileReads.push(fp);

              if (basename(fp) === 'CLAUDE.md' && projectPath) {
                raw.claudeMdReads.push(fp);
                const rel = relative(projectPath, fp);
                if (rel === 'CLAUDE.md') {
                  raw.rootClaudeMdRead = true;
                } else if (rel && !rel.startsWith('..')) {
                  raw.subdirClaudeMdRead = true;
                }
              }
            }

            if ((block.name === 'Edit' || block.name === 'Write') && fp) {
              raw.fileWrites.push(fp);
            }
          }
        }
      }
    }
  }

  // Calculate timestamps
  if (timestamps.length > 0) {
    timestamps.sort();
    raw.startTime = timestamps[0];
    raw.endTime = timestamps[timestamps.length - 1];
    raw.durationMs = new Date(raw.endTime) - new Date(raw.startTime);
  }

  return raw;
}

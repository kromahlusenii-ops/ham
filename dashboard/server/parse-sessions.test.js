import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir, homedir } from 'os';

import { parseSessions } from './parse-sessions.js';

// --- Helpers ---

/**
 * Create a project dir and its corresponding session dir in ~/.claude/projects/.
 * Returns { projectPath, sessionDir, cleanup }.
 */
function makeTestProject() {
  const projectPath = mkdtempSync(join(tmpdir(), 'ham-parse-test-'));
  // getProjectSessionDir encodes path by replacing / with -
  const encoded = projectPath.replace(/\//g, '-');
  const sessionDir = join(homedir(), '.claude', 'projects', encoded);
  mkdirSync(sessionDir, { recursive: true });

  return {
    projectPath,
    sessionDir,
    cleanup() {
      rmSync(projectPath, { recursive: true, force: true });
      rmSync(sessionDir, { recursive: true, force: true });
    },
  };
}

/**
 * Build a minimal session JSONL string with configurable CLAUDE.md reads.
 */
function buildSessionJsonl(projectPath, { sessionId = 'sess-001', readRoot = false, readSubdir = false, subdirName = 'src' } = {}) {
  const lines = [];
  const ts = '2026-03-18T10:00:00Z';

  // User message with sessionId
  lines.push(JSON.stringify({
    sessionId,
    timestamp: ts,
    message: { role: 'user', content: 'Hello' },
  }));

  // Assistant message with tool_use reads
  const toolBlocks = [];
  if (readRoot) {
    toolBlocks.push({
      type: 'tool_use',
      name: 'Read',
      input: { file_path: join(projectPath, 'CLAUDE.md') },
    });
  }
  if (readSubdir) {
    toolBlocks.push({
      type: 'tool_use',
      name: 'Read',
      input: { file_path: join(projectPath, subdirName, 'CLAUDE.md') },
    });
  }
  // Add a non-CLAUDE.md read to get some file reads
  toolBlocks.push({
    type: 'tool_use',
    name: 'Read',
    input: { file_path: join(projectPath, 'src', 'index.js') },
  });

  lines.push(JSON.stringify({
    timestamp: '2026-03-18T10:01:00Z',
    message: {
      role: 'assistant',
      model: 'claude-sonnet-4-6',
      usage: { input_tokens: 500, output_tokens: 200, cache_read_input_tokens: 100 },
      content: toolBlocks,
    },
  }));

  return lines.join('\n');
}

// --- Tests ---

describe('parseSessions — HAM-on detection', () => {
  let env;

  beforeEach(() => { env = makeTestProject(); });
  afterEach(() => { env.cleanup(); });

  it('isHamOn = false when no CLAUDE.md reads at all', async () => {
    writeFileSync(join(env.sessionDir, 'session1.jsonl'),
      buildSessionJsonl(env.projectPath, { readRoot: false, readSubdir: false }));

    const sessions = await parseSessions(env.projectPath);
    assert.equal(sessions.length, 1);
    assert.equal(sessions[0].isHamOn, false);
  });

  it('isHamOn = false when only root CLAUDE.md is read (no subdir)', async () => {
    // Create root CLAUDE.md with Agent Memory System
    writeFileSync(join(env.projectPath, 'CLAUDE.md'), '## Agent Memory System\nSome content');
    writeFileSync(join(env.sessionDir, 'session1.jsonl'),
      buildSessionJsonl(env.projectPath, { readRoot: true, readSubdir: false }));

    const sessions = await parseSessions(env.projectPath);
    assert.equal(sessions.length, 1);
    assert.equal(sessions[0].isHamOn, false);
    assert.equal(sessions[0].rootClaudeMdRead, true);
    assert.equal(sessions[0].subdirClaudeMdRead, false);
  });

  it('isHamOn = false when only subdir CLAUDE.md is read (no root)', async () => {
    writeFileSync(join(env.sessionDir, 'session1.jsonl'),
      buildSessionJsonl(env.projectPath, { readRoot: false, readSubdir: true }));

    const sessions = await parseSessions(env.projectPath);
    assert.equal(sessions.length, 1);
    assert.equal(sessions[0].isHamOn, false);
  });

  it('isHamOn = false when both are read but root lacks Agent Memory System', async () => {
    // Root CLAUDE.md WITHOUT the required section
    writeFileSync(join(env.projectPath, 'CLAUDE.md'), '# My Project\n\n## Rules\nSome rules');
    writeFileSync(join(env.sessionDir, 'session1.jsonl'),
      buildSessionJsonl(env.projectPath, { readRoot: true, readSubdir: true }));

    const sessions = await parseSessions(env.projectPath);
    assert.equal(sessions.length, 1);
    assert.equal(sessions[0].isHamOn, false);
    assert.equal(sessions[0].rootClaudeMdRead, true);
    assert.equal(sessions[0].subdirClaudeMdRead, true);
  });

  it('isHamOn = true when both root and subdir are read AND root has Agent Memory System', async () => {
    // Root CLAUDE.md WITH the required section
    writeFileSync(join(env.projectPath, 'CLAUDE.md'), '# My Project\n\n## Agent Memory System\nOperating instructions');
    writeFileSync(join(env.sessionDir, 'session1.jsonl'),
      buildSessionJsonl(env.projectPath, { readRoot: true, readSubdir: true }));

    const sessions = await parseSessions(env.projectPath);
    assert.equal(sessions.length, 1);
    assert.equal(sessions[0].isHamOn, true);
    assert.equal(sessions[0].rootClaudeMdRead, true);
    assert.equal(sessions[0].subdirClaudeMdRead, true);
  });
});

describe('parseSessions — extractRoutingPaths returns content', () => {
  let env;

  beforeEach(() => { env = makeTestProject(); });
  afterEach(() => { env.cleanup(); });

  it('routing works when Context Routing section is present', async () => {
    mkdirSync(join(env.projectPath, 'src', 'api'), { recursive: true });
    writeFileSync(join(env.projectPath, 'CLAUDE.md'), [
      '# My Project',
      '',
      '## Agent Memory System',
      'Instructions',
      '',
      '## Context Routing',
      '→ api: src/api/CLAUDE.md',
    ].join('\n'));

    // Session reads root then the routed subdir
    const lines = [];
    lines.push(JSON.stringify({
      sessionId: 'sess-route',
      timestamp: '2026-03-18T10:00:00Z',
      message: { role: 'user', content: 'Fix API' },
    }));
    lines.push(JSON.stringify({
      timestamp: '2026-03-18T10:01:00Z',
      message: {
        role: 'assistant',
        model: 'claude-sonnet-4-6',
        usage: { input_tokens: 500, output_tokens: 200 },
        content: [
          { type: 'tool_use', name: 'Read', input: { file_path: join(env.projectPath, 'CLAUDE.md') } },
          { type: 'tool_use', name: 'Read', input: { file_path: join(env.projectPath, 'src', 'api', 'CLAUDE.md') } },
        ],
      },
    }));

    writeFileSync(join(env.sessionDir, 'session1.jsonl'), lines.join('\n'));

    const sessions = await parseSessions(env.projectPath);
    assert.equal(sessions.length, 1);
    assert.equal(sessions[0].routingStatus, 'routed');
    assert.equal(sessions[0].isHamOn, true);
  });
});

describe('parseSessions — edge cases', () => {
  let env;

  beforeEach(() => { env = makeTestProject(); });
  afterEach(() => { env.cleanup(); });

  it('returns empty array when no session files exist', async () => {
    const sessions = await parseSessions(env.projectPath);
    assert.deepEqual(sessions, []);
  });

  it('skips malformed JSONL lines without crashing', async () => {
    const content = [
      'not json at all',
      JSON.stringify({
        sessionId: 'sess-bad',
        timestamp: '2026-03-18T10:00:00Z',
        message: { role: 'user', content: 'Hi' },
      }),
      '{"also: broken',
      JSON.stringify({
        timestamp: '2026-03-18T10:01:00Z',
        message: {
          role: 'assistant',
          model: 'claude-sonnet-4-6',
          usage: { input_tokens: 100, output_tokens: 50 },
          content: [],
        },
      }),
    ].join('\n');

    writeFileSync(join(env.sessionDir, 'session1.jsonl'), content);

    const sessions = await parseSessions(env.projectPath);
    assert.equal(sessions.length, 1);
    assert.equal(sessions[0].sessionId, 'sess-bad');
  });

  it('handles missing root CLAUDE.md gracefully', async () => {
    // No CLAUDE.md in project — extractRoutingPaths should return empty
    writeFileSync(join(env.sessionDir, 'session1.jsonl'),
      buildSessionJsonl(env.projectPath, { readRoot: false, readSubdir: true }));

    const sessions = await parseSessions(env.projectPath);
    assert.equal(sessions.length, 1);
    assert.equal(sessions[0].isHamOn, false);
    assert.equal(sessions[0].routingStatus, 'unrouted');
  });
});

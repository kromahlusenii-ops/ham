import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

import {
  getBenchmarkState,
  readTaskEntries,
  calculateBenchmarkSummary,
  calculateBenchmarkComparison,
  getRecentTasks,
} from './benchmark.js';

// --- Helpers ---

function makeProject() {
  const dir = mkdtempSync(join(tmpdir(), 'ham-bench-test-'));
  mkdirSync(join(dir, '.ham', 'metrics'), { recursive: true });
  return dir;
}

function writeState(dir, obj) {
  writeFileSync(join(dir, '.ham', 'metrics', 'state.json'), JSON.stringify(obj));
}

function writeJsonl(dir, filename, entries) {
  const content = entries.map(e => JSON.stringify(e)).join('\n');
  writeFileSync(join(dir, '.ham', 'metrics', filename), content);
}

function makeTaskPair(id, { ham_active = true, model = 'claude-sonnet-4-20250514', durationMs = 5000, tokens = 1000, files_read = 3, status = 'completed' } = {}) {
  const start = new Date('2026-03-18T10:00:00Z').getTime();
  return [
    {
      id,
      type: 'task_start',
      timestamp: new Date(start).toISOString(),
      description: `Task ${id}`,
      ham_active,
      model,
      files_read,
      memory_files_loaded: 2,
      estimated_tokens: tokens,
    },
    {
      id,
      type: 'task_end',
      timestamp: new Date(start + durationMs).toISOString(),
      status,
    },
  ];
}

// --- Tests ---

describe('getBenchmarkState', () => {
  let dir;
  beforeEach(() => { dir = makeProject(); });
  afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

  it('returns mode none with null warning when state.json missing', () => {
    // .ham/metrics exists but no state.json
    const result = getBenchmarkState(dir);
    assert.equal(result.mode, 'none');
    assert.equal(result.warning, null);
  });

  it('returns parsed state with null warning for valid JSON', () => {
    writeState(dir, { mode: 'baseline', tasks_completed: 3, tasks_target: 10 });
    const result = getBenchmarkState(dir);
    assert.equal(result.mode, 'baseline');
    assert.equal(result.tasks_completed, 3);
    assert.equal(result.warning, null);
  });

  it('returns active mode with warning for corrupted JSON', () => {
    writeFileSync(join(dir, '.ham', 'metrics', 'state.json'), '{not valid json!!!');
    const result = getBenchmarkState(dir);
    assert.equal(result.mode, 'active');
    assert.ok(result.warning);
    assert.ok(result.warning.includes('corrupted'));
  });
});

describe('readTaskEntries', () => {
  let dir;
  beforeEach(() => { dir = makeProject(); });
  afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

  it('returns empty tasks with null warning when file missing', () => {
    const result = readTaskEntries(dir, 'tasks.jsonl');
    assert.deepEqual(result.tasks, []);
    assert.equal(result.warning, null);
  });

  it('pairs task_start and task_end entries', () => {
    const [start, end] = makeTaskPair('task-001');
    writeJsonl(dir, 'tasks.jsonl', [start, end]);

    const result = readTaskEntries(dir, 'tasks.jsonl');
    assert.equal(result.tasks.length, 1);
    assert.equal(result.tasks[0].id, 'task-001');
    assert.equal(result.tasks[0].status, 'completed');
    assert.equal(result.warning, null);
  });

  it('reports warning for malformed lines', () => {
    const [start, end] = makeTaskPair('task-002');
    const content = [
      JSON.stringify(start),
      'this is not json',
      '{"also": broken',
      JSON.stringify(end),
    ].join('\n');
    writeFileSync(join(dir, '.ham', 'metrics', 'tasks.jsonl'), content);

    const result = readTaskEntries(dir, 'tasks.jsonl');
    assert.equal(result.tasks.length, 1);
    assert.ok(result.warning);
    assert.ok(result.warning.includes('2 malformed line(s)'));
  });

  it('handles unpaired entries gracefully', () => {
    const [start] = makeTaskPair('task-orphan');
    writeJsonl(dir, 'tasks.jsonl', [start]); // no end entry

    const result = readTaskEntries(dir, 'tasks.jsonl');
    assert.equal(result.tasks.length, 0);
    assert.equal(result.warning, null);
  });
});

describe('calculateBenchmarkSummary', () => {
  let dir;
  beforeEach(() => { dir = makeProject(); });
  afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

  it('returns zero summary with warnings array when no data', () => {
    const result = calculateBenchmarkSummary(dir, [], 30);
    assert.equal(result.totalTasks, 0);
    assert.ok(Array.isArray(result.warnings));
  });

  it('summarizes tasks and includes warnings array', () => {
    const pairs = [
      ...makeTaskPair('task-a', { ham_active: true }),
      ...makeTaskPair('task-b', { ham_active: true }),
    ];
    writeJsonl(dir, 'tasks.jsonl', pairs);

    const result = calculateBenchmarkSummary(dir, [], 30);
    assert.equal(result.totalTasks, 2);
    assert.ok(result.avgWallClockSec >= 0);
    assert.ok(Array.isArray(result.warnings));
  });

  it('propagates JSONL warnings', () => {
    const [start, end] = makeTaskPair('task-w');
    const content = JSON.stringify(start) + '\nBAD LINE\n' + JSON.stringify(end);
    writeFileSync(join(dir, '.ham', 'metrics', 'tasks.jsonl'), content);

    const result = calculateBenchmarkSummary(dir, [], 30);
    assert.ok(result.warnings.length > 0);
    assert.ok(result.warnings[0].includes('malformed'));
  });
});

describe('calculateBenchmarkComparison', () => {
  let dir;
  beforeEach(() => { dir = makeProject(); });
  afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

  it('returns hasData false with warnings when no data', () => {
    const result = calculateBenchmarkComparison(dir, [], 30);
    assert.equal(result.hasData, false);
    assert.ok(Array.isArray(result.warnings));
  });

  it('computes comparison when both baseline and active exist', () => {
    writeJsonl(dir, 'baseline.jsonl', makeTaskPair('bl-1', { ham_active: false, tokens: 2000 }));
    writeJsonl(dir, 'tasks.jsonl', makeTaskPair('act-1', { ham_active: true, tokens: 1000 }));

    const result = calculateBenchmarkComparison(dir, [], 30);
    assert.equal(result.hasData, true);
    assert.ok(result.baseline);
    assert.ok(result.active);
    assert.ok(result.comparison);
    assert.ok(Array.isArray(result.warnings));
  });

  it('includes per-model breakdown', () => {
    writeJsonl(dir, 'tasks.jsonl', [
      ...makeTaskPair('m1', { ham_active: true, model: 'claude-opus-4-6' }),
      ...makeTaskPair('m2', { ham_active: true, model: 'claude-sonnet-4-6' }),
    ]);

    const result = calculateBenchmarkComparison(dir, [], 30);
    assert.ok(result.byModel['claude-opus-4-6']);
    assert.ok(result.byModel['claude-sonnet-4-6']);
  });
});

describe('getRecentTasks', () => {
  let dir;
  beforeEach(() => { dir = makeProject(); });
  afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

  it('returns { tasks, warnings } shape', () => {
    const result = getRecentTasks(dir, [], 20, 30);
    assert.ok(Array.isArray(result.tasks));
    assert.ok(Array.isArray(result.warnings));
  });

  it('returns tasks up to limit', () => {
    const entries = [];
    for (let i = 0; i < 5; i++) {
      entries.push(...makeTaskPair(`task-${i}`, { ham_active: true }));
    }
    writeJsonl(dir, 'tasks.jsonl', entries);

    const result = getRecentTasks(dir, [], 3, 30);
    assert.equal(result.tasks.length, 3);
  });

  it('includes tasks from both baseline and active files', () => {
    writeJsonl(dir, 'baseline.jsonl', makeTaskPair('bl-1', { ham_active: false }));
    writeJsonl(dir, 'tasks.jsonl', makeTaskPair('act-1', { ham_active: true }));

    const result = getRecentTasks(dir, [], 20, 30);
    assert.equal(result.tasks.length, 2);
    const ids = result.tasks.map(t => t.id);
    assert.ok(ids.includes('bl-1'));
    assert.ok(ids.includes('act-1'));
  });
});

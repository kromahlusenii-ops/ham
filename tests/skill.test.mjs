import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = '/Users/luseniikromah/Developer/ham-skill';
const skillPath = join(repoRoot, 'SKILL.md');
const skill = readFileSync(skillPath, 'utf8');

const requiredTriggers = [
  'go ham',
  'set up HAM',
  'ham commands',
  'ham help',
  'ham route',
  'ham remove',
  'ham update',
  'ham status',
  'ham benchmark',
  'ham baseline start',
  'ham baseline stop',
  'ham metrics clear',
  'HAM savings',
  'HAM stats',
  'HAM dashboard',
  'HAM sandwich',
  'HAM insights',
  'HAM carbon',
  'ham sync',
];

const requiredSections = [
  '## Pro Guard',
  '## Commands',
  '## go ham',
  '## Operating Instructions',
  '## Task Metrics Logging',
  '## ham savings',
  '## ham remove',
  '## ham route',
  '## ham dashboard',
  '## ham insights',
  '## ham audit',
  '## ham baseline start / stop',
  '## Templates',
];

describe('claude ham skill trigger coverage', () => {
  it('includes all required trigger phrases in frontmatter description', () => {
    const frontmatter = skill.split('---')[1];
    for (const trigger of requiredTriggers) {
      assert.match(frontmatter, new RegExp(trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  });

  it('includes sections for every major command workflow', () => {
    for (const section of requiredSections) {
      assert.match(skill, new RegExp(section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  });

  it('preserves the Pro guard stop message and ownership rules', () => {
    assert.match(skill, /HAM Pro detected — this project is managed by HAM Pro\. Manage at goham\.dev/);
    assert.match(skill, /CLAUDE\.md = HAM-owned\. AGENTS\.md = Pro-owned\./);
  });
});

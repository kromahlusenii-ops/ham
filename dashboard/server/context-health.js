import { readdir, stat, access } from 'fs/promises';
import { join, relative, extname } from 'path';
import { SOURCE_EXTENSIONS } from './utils.js';

/**
 * Walk the project tree and check CLAUDE.md health per directory.
 * @param {string} projectPath - Root project path
 * @param {Array} sessions - Parsed session objects (for touch counts)
 * @returns {Array} Health entries
 */
export async function checkContextHealth(projectPath, sessions) {
  const dirTouchCounts = buildDirTouchCounts(sessions, projectPath);
  const entries = [];

  await walkDirectory(projectPath, projectPath, dirTouchCounts, entries);

  // Build set of paths that have their own CLAUDE.md
  const coveredPaths = new Set(
    entries.filter(e => e.hasClaude).map(e => e.path)
  );

  // Second pass: check parent coverage for red entries
  for (const entry of entries) {
    if (entry.status !== 'red') continue;

    const parentPath = findCoveringParent(entry.path, coveredPaths);
    if (parentPath !== null) {
      const parentEntry = entries.find(e => e.path === parentPath);
      entry.status = 'yellow';
      entry.coveredBy = parentPath;
      if (parentEntry) {
        entry.lastModified = parentEntry.lastModified;
        entry.fileSize = parentEntry.fileSize;
      }
    }
  }

  return entries.sort((a, b) => {
    const statusOrder = { green: 0, yellow: 1, amber: 2, red: 3 };
    return (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4);
  });
}

async function walkDirectory(dir, projectPath, dirTouchCounts, entries) {
  let items;
  try {
    items = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  // Skip hidden dirs, node_modules, dist, build, etc.
  const dirName = dir.split('/').pop();
  if (dirName.startsWith('.') && dir !== projectPath) return;
  if (['node_modules', 'dist', 'build', '.git', '__pycache__', '.next', 'vendor'].includes(dirName)) return;

  const hasSourceFiles = items.some(
    i => i.isFile() && SOURCE_EXTENSIONS.has(extname(i.name))
  );

  if (hasSourceFiles) {
    const relPath = relative(projectPath, dir) || '.';
    const claudeMdPath = join(dir, 'CLAUDE.md');
    let hasClaude = false;
    let lastModified = null;
    let fileSize = 0;

    try {
      await access(claudeMdPath);
      const s = await stat(claudeMdPath);
      hasClaude = true;
      lastModified = s.mtime.toISOString();
      fileSize = s.size;
    } catch {
      // No CLAUDE.md
    }

    const touchCount = dirTouchCounts[relPath] || 0;
    const status = getStatus(hasClaude, lastModified, touchCount);

    entries.push({
      path: relPath,
      hasClaude,
      status,
      lastModified,
      fileSize,
      sessionsTouched: touchCount,
    });
  }

  // Recurse into subdirectories
  for (const item of items) {
    if (item.isDirectory()) {
      await walkDirectory(join(dir, item.name), projectPath, dirTouchCounts, entries);
    }
  }
}

/**
 * Walk up path segments to find the nearest ancestor with a CLAUDE.md.
 * Returns the ancestor's relative path, or null if none found.
 */
function findCoveringParent(relPath, coveredPaths) {
  if (relPath === '.') return null;

  const segments = relPath.split('/');
  // Walk up from immediate parent to root
  for (let i = segments.length - 1; i >= 0; i--) {
    const ancestor = i === 0 ? '.' : segments.slice(0, i).join('/');
    if (coveredPaths.has(ancestor)) return ancestor;
  }
  return null;
}

/**
 * Determine health status.
 * - Green: CLAUDE.md exists and is recent relative to session activity
 * - Yellow: Covered by a parent CLAUDE.md (set in second pass)
 * - Amber: CLAUDE.md exists but 2+ sessions have touched this dir since last mod
 * - Red: No CLAUDE.md in a directory with source files
 */
function getStatus(hasClaude, lastModified, touchCount) {
  if (!hasClaude) return 'red';

  if (touchCount >= 2) {
    return 'amber';
  }

  return 'green';
}

/**
 * Build a map of relative directory → number of sessions that read files there.
 */
function buildDirTouchCounts(sessions, projectPath) {
  const counts = {};

  for (const session of sessions) {
    const dirsInSession = new Set();

    for (const fp of session.fileReads) {
      if (fp.endsWith('CLAUDE.md')) continue;
      const rel = relative(projectPath, fp);
      if (rel.startsWith('..')) continue;

      const dir = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : '.';
      dirsInSession.add(dir);
    }

    for (const dir of dirsInSession) {
      counts[dir] = (counts[dir] || 0) + 1;
    }
  }

  return counts;
}

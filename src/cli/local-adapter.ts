import * as fs from "fs";
import * as path from "path";
import type { ContextFile, CompileConfig, Source } from "../lib/compiler/types";
import { parseConfig, createDefaultConfig } from "../lib/compiler/config";

/** File patterns for local filesystem discovery. */
const LOCAL_FILE_PATTERNS: { pattern: RegExp; source: Source }[] = [
  { pattern: /^\.ham\/(?!config\.json$|compiled\/).*\.md$/, source: "ham" },
  { pattern: /CLAUDE\.md$/, source: "claude" },
  { pattern: /\.cursorrules$/, source: "cursor" },
  { pattern: /\.github\/copilot-instructions\.md$/, source: "copilot" },
  { pattern: /GEMINI\.md$/, source: "gemini" },
  { pattern: /\.gemini\/.+\.md$/, source: "gemini" },
  { pattern: /\.aider\.conf\.yml$/, source: "aider" },
  { pattern: /\.aiderignore$/, source: "aider" },
  { pattern: /LLAMA\.md$/, source: "llama" },
  { pattern: /\.llama\/.+\.md$/, source: "llama" },
  { pattern: /MANUS\.md$/, source: "manus" },
  { pattern: /\.manus\/.+\.md$/, source: "manus" },
];

const IGNORED_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next"]);

/** Discover and read all context files from the local filesystem. */
export function discoverLocalFiles(rootDir: string): ContextFile[] {
  const files: ContextFile[] = [];

  function walk(dir: string) {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(rootDir, fullPath);

      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) continue;
        walk(fullPath);
      } else if (entry.isFile()) {
        for (const { pattern, source } of LOCAL_FILE_PATTERNS) {
          if (pattern.test(relativePath)) {
            const content = fs.readFileSync(fullPath, "utf-8");
            files.push({ path: relativePath, content, source });
            break;
          }
        }
      }
    }
  }

  walk(rootDir);
  return files;
}

/** Read .ham/config.json if it exists, merge with defaults. */
export function readLocalConfig(rootDir: string): CompileConfig {
  const configPath = path.join(rootDir, ".ham", "config.json");

  if (fs.existsSync(configPath)) {
    try {
      const raw = fs.readFileSync(configPath, "utf-8");
      return parseConfig(raw);
    } catch {
      // Invalid config — fall through to defaults
    }
  }

  return createDefaultConfig();
}

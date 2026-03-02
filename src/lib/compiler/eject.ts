import * as fs from "fs";
import * as path from "path";
import type { EjectResult } from "./types";

const HAM_BEGIN = /^\s*(?:<!--|#|\/\/)\s*HAM:BEGIN\s*(?:-->)?\s*$/;
const HAM_END = /^\s*(?:<!--|#|\/\/)\s*HAM:END\s*(?:-->)?\s*$/;

/**
 * PRD Section 16 — Eject system.
 * Scans for HAM:BEGIN / HAM:END marker blocks in tool files.
 */
export function eject(
  rootDir: string,
  options: {
    full: boolean;
    markerPolicy: "keep_content" | "strip_all";
  }
): EjectResult {
  const result: EjectResult = {
    removedMarkers: [],
    removedDirectory: false,
    summary: "",
  };

  // Find all files that might contain HAM markers
  const toolFiles = findToolFiles(rootDir);

  for (const filePath of toolFiles) {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    const processed = processMarkers(lines, options.markerPolicy);

    if (processed.removed > 0) {
      fs.writeFileSync(filePath, processed.lines.join("\n"), "utf-8");
      result.removedMarkers.push({
        file: path.relative(rootDir, filePath),
        linesRemoved: processed.removed,
      });
    }
  }

  // Full eject: remove .ham/ directory
  if (options.full) {
    const hamDir = path.join(rootDir, ".ham");
    if (fs.existsSync(hamDir)) {
      fs.rmSync(hamDir, { recursive: true, force: true });
      result.removedDirectory = true;
    }
  }

  const markerCount = result.removedMarkers.length;
  const parts: string[] = [];
  if (markerCount > 0) {
    parts.push(`Removed markers from ${markerCount} file${markerCount !== 1 ? "s" : ""}`);
  }
  if (result.removedDirectory) {
    parts.push("Removed .ham/ directory");
  }
  result.summary = parts.length > 0 ? parts.join(". ") + "." : "No HAM markers or directory found.";

  return result;
}

/** Process marker blocks in a file's lines. */
function processMarkers(
  lines: string[],
  policy: "keep_content" | "strip_all"
): { lines: string[]; removed: number } {
  const result: string[] = [];
  let inBlock = false;
  let removed = 0;

  for (const line of lines) {
    if (HAM_BEGIN.test(line)) {
      inBlock = true;
      removed++;
      continue; // always remove the marker line itself
    }

    if (HAM_END.test(line)) {
      inBlock = false;
      removed++;
      continue; // always remove the marker line itself
    }

    if (inBlock && policy === "strip_all") {
      removed++;
      continue;
    }

    result.push(line);
  }

  return { lines: result, removed };
}

/** Find files that could contain HAM markers. */
function findToolFiles(rootDir: string): string[] {
  const toolPatterns = [
    /CLAUDE\.md$/,
    /\.cursorrules$/,
    /\.github\/copilot-instructions\.md$/,
    /GEMINI\.md$/,
    /\.gemini\/.+\.md$/,
    /LLAMA\.md$/,
    /\.llama\/.+\.md$/,
    /MANUS\.md$/,
    /\.manus\/.+\.md$/,
    /\.aider\.conf\.yml$/,
  ];

  const files: string[] = [];

  function walk(dir: string) {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip ignored directories
        if (["node_modules", ".git", "dist", "build", ".next", ".ham"].includes(entry.name)) {
          continue;
        }
        walk(fullPath);
      } else if (entry.isFile()) {
        const relativePath = path.relative(rootDir, fullPath);
        if (toolPatterns.some((p) => p.test(relativePath))) {
          files.push(fullPath);
        }
      }
    }
  }

  walk(rootDir);
  return files;
}

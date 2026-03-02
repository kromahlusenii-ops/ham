import { createHash } from "crypto";
import type { EntryKind, Strength } from "../types";
import { matchTaxonomyKey as matchKey } from "../taxonomy";

export { matchKey as matchTaxonomyKey };

// ── Section Extraction ───────────────────────────────────────────────

export interface MarkdownSection {
  heading: string;
  level: number;
  body: string;
  lineOffset: number;
}

/** Split markdown by H1/H2/H3 headings, returning sections with their content. */
export function extractHeadings(md: string): MarkdownSection[] {
  const lines = md.split("\n");
  const sections: MarkdownSection[] = [];
  let current: MarkdownSection | null = null;
  let bodyLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(#{1,3})\s+(.+)/);
    if (match) {
      if (current) {
        current.body = bodyLines.join("\n").trim();
        sections.push(current);
      }
      current = {
        heading: match[2].trim(),
        level: match[1].length,
        body: "",
        lineOffset: i + 1,
      };
      bodyLines = [];
    } else {
      bodyLines.push(lines[i]);
    }
  }

  if (current) {
    current.body = bodyLines.join("\n").trim();
    sections.push(current);
  }

  return sections;
}

/** Extract bullet-point directives from markdown text. */
export function extractBullets(md: string): { text: string; lineNumber: number }[] {
  const results: { text: string; lineNumber: number }[] = [];
  const lines = md.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^\s*[-*+]\s+(.+)/);
    if (match) {
      results.push({ text: match[1].trim(), lineNumber: i + 1 });
    }
  }

  return results;
}

// ── Strength Detection ───────────────────────────────────────────────

const HARD_PATTERNS = [/\bMUST\b/, /\bNEVER\b/, /\bALWAYS\b/, /\bREQUIRED?\b/, /\bDO NOT\b/i];
const SOFT_PATTERNS = [/\bSHOULD\b/, /\bprefer\b/i, /\brecommend/i, /\bconsider\b/i];

/** Detect strength from prose: MUST/NEVER/ALWAYS → hard, SHOULD/prefer → soft. */
export function detectStrength(line: string): Strength {
  for (const pattern of HARD_PATTERNS) {
    if (pattern.test(line)) return "hard";
  }
  for (const pattern of SOFT_PATTERNS) {
    if (pattern.test(line)) return "soft";
  }
  return "soft";
}

// ── Kind Detection ───────────────────────────────────────────────────

const CONSTRAINT_PATTERNS = [/\bMUST\b/, /\bNEVER\b/, /\bDO NOT\b/i, /\brequire/i, /\bforbid/i];
const KNOWLEDGE_HEADINGS = ["stack", "context", "architecture", "overview", "about"];

/** Infer the EntryKind from a line and its section heading. */
export function detectKind(line: string, sectionHeading?: string): EntryKind {
  for (const pattern of CONSTRAINT_PATTERNS) {
    if (pattern.test(line)) return "constraint";
  }
  if (sectionHeading && KNOWLEDGE_HEADINGS.some((h) => sectionHeading.toLowerCase().includes(h))) {
    return "knowledge";
  }
  if (/\bprefer\b/i.test(line) || /\bstyle\b/i.test(line)) return "preference";
  return "directive";
}

// ── Hashing ──────────────────────────────────────────────────────────

/** SHA-256 hash → stable entry ID. */
export function stableHash(scope: string, source: string, content: string): string {
  return createHash("sha256")
    .update(`${scope}:${source}:${content}`)
    .digest("hex")
    .slice(0, 16);
}

// ── Frontmatter ──────────────────────────────────────────────────────

export interface ParsedFrontmatter {
  frontmatter: Record<string, unknown>;
  body: string;
}

/** Extract YAML frontmatter block if present. */
export function parseFrontmatter(md: string): ParsedFrontmatter {
  const fmMatch = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!fmMatch) return { frontmatter: {}, body: md };

  const fm: Record<string, unknown> = {};
  const lines = fmMatch[1].split("\n");
  for (const line of lines) {
    const kvMatch = line.match(/^(\w[\w.]*)\s*:\s*(.+)/);
    if (kvMatch) {
      const val = kvMatch[2].trim();
      // Handle YAML arrays like [a, b, c]
      if (val.startsWith("[") && val.endsWith("]")) {
        fm[kvMatch[1]] = val.slice(1, -1).split(",").map((s) => s.trim());
      } else {
        fm[kvMatch[1]] = val;
      }
    }
  }

  return { frontmatter: fm, body: fmMatch[2] };
}

// ── Shared Scope Utilities ───────────────────────────────────────────

/** Extract directory path from a file path. */
export function getScope(filePath: string): string {
  const lastSlash = filePath.lastIndexOf("/");
  return lastSlash === -1 ? "" : filePath.slice(0, lastSlash);
}

/** Calculate directory depth. */
export function getDepth(scope: string): number {
  return scope === "" ? 0 : scope.split("/").length;
}

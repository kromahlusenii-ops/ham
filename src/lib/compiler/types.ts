// ── MMHCS Context Compiler — Core Types ─────────────────────────────

export type Source = "ham" | "cursor" | "claude" | "gemini" | "aider" | "copilot" | "llama" | "manus";
export type AuthorMode = "human" | "generated";
export type EntryKind = "constraint" | "directive" | "knowledge" | "preference";
export type Strength = "hard" | "soft";
export type Target = "cursor" | "claude" | "gemini" | "aider" | "copilot" | "llama" | "manus" | "universal";

export interface NormalizedEntry {
  /** Stable hash of content+scope */
  id: string;
  /** Directory path */
  scope: string;
  depth: number;
  source: Source;
  authorMode: AuthorMode;
  kind: EntryKind;
  /** Canonical taxonomy key or "unkeyed.directive" */
  key: string;
  value: string | boolean;
  strength: Strength;
  /** Source file path + line ref */
  rawRef: string;
}

export interface ContextFile {
  path: string;
  content: string;
  source: Source;
}

export interface ConflictBlock {
  key: string;
  kind: EntryKind;
  scope: string;
  winner: { value: string | boolean; source: Source; rawRef: string };
  loser: { value: string | boolean; source: Source; rawRef: string };
  suggestion: string;
}

export interface CompileResult {
  /** Rendered text for target tool */
  bundle: string;
  report: CompileReport;
  cacheKey: string;
}

export interface CompileReport {
  target: Target;
  targetPath: string;
  conflicts: ConflictBlock[];
  includedEntries: number;
  tokenCount: number;
  /** Percentage of budget used */
  budgetUsed: number;
  sources: { source: Source; entries: number; files: string[] }[];
}

export interface CompileConfig {
  hamVersion: string;
  enabledImporters: Source[];
  precedencePreset: "target-first" | "ham-first" | "advisory";
  defaultBudget: number;
  ignoredPaths: string[];
  taxonomyVersion: string;
}

export interface EjectResult {
  removedMarkers: { file: string; linesRemoved: number }[];
  removedDirectory: boolean;
  summary: string;
}

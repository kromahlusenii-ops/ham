import type { ContextFile, NormalizedEntry, Source } from "../types";
import { parseHamFile } from "./ham";
import { parseClaudeFile } from "./claude";
import { parseCursorFile } from "./cursor";
import { parseCopilotFile } from "./copilot";
import { parseGeminiFile } from "./gemini";
import { parseAiderFile } from "./aider";
import { parseLlamaFile } from "./llama";
import { parseManusFile } from "./manus";

type ImporterFn = (file: ContextFile) => NormalizedEntry[];

const IMPORTER_REGISTRY: Record<Source, ImporterFn> = {
  ham: parseHamFile,
  claude: parseClaudeFile,
  cursor: parseCursorFile,
  copilot: parseCopilotFile,
  gemini: parseGeminiFile,
  aider: parseAiderFile,
  llama: parseLlamaFile,
  manus: parseManusFile,
};

/** Route a context file to the correct importer based on its source. */
export function parseFile(file: ContextFile): NormalizedEntry[] {
  const importer = IMPORTER_REGISTRY[file.source];
  if (!importer) return [];
  return importer(file);
}

export {
  parseHamFile,
  parseClaudeFile,
  parseCursorFile,
  parseCopilotFile,
  parseGeminiFile,
  parseAiderFile,
  parseLlamaFile,
  parseManusFile,
};

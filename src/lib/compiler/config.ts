import type { CompileConfig } from "./types";

/** Default compiler configuration. */
export function createDefaultConfig(overrides?: Partial<CompileConfig>): CompileConfig {
  return {
    hamVersion: "1.0.0",
    enabledImporters: ["ham", "claude", "cursor", "gemini", "aider", "copilot", "llama", "manus"],
    precedencePreset: "target-first",
    defaultBudget: 2000,
    ignoredPaths: ["node_modules", ".git", "dist", "build", ".next"],
    taxonomyVersion: "1.0.0",
    ...overrides,
  };
}

/** JSON schema shape for .ham/config.json validation. */
export const CONFIG_SCHEMA = {
  type: "object",
  properties: {
    hamVersion: { type: "string" },
    enabledImporters: {
      type: "array",
      items: { type: "string", enum: ["ham", "claude", "cursor", "gemini", "aider", "copilot", "llama", "manus"] },
    },
    precedencePreset: { type: "string", enum: ["target-first", "ham-first", "advisory"] },
    defaultBudget: { type: "number", minimum: 100, maximum: 50000 },
    ignoredPaths: { type: "array", items: { type: "string" } },
    taxonomyVersion: { type: "string" },
  },
} as const;

/** Parse a .ham/config.json string, merging with defaults. */
export function parseConfig(jsonString: string): CompileConfig {
  const parsed = JSON.parse(jsonString) as Partial<CompileConfig>;
  return createDefaultConfig(parsed);
}

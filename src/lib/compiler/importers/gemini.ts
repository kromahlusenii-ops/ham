import type { ContextFile, NormalizedEntry } from "../types";
import {
  extractHeadings,
  extractBullets,
  detectStrength,
  detectKind,
  matchTaxonomyKey,
  stableHash,
  getScope,
  getDepth,
} from "./parse-utils";

/** Parse GEMINI.md / .gemini/*.md markdown files. */
function parseGeminiMd(file: ContextFile): NormalizedEntry[] {
  const entries: NormalizedEntry[] = [];
  const scope = getScope(file.path);
  const depth = getDepth(scope);

  const sections = extractHeadings(file.content);

  for (const section of sections) {
    const bullets = extractBullets(section.body);
    for (const bullet of bullets) {
      entries.push({
        id: stableHash(scope, "gemini", bullet.text),
        scope,
        depth,
        source: "gemini",
        authorMode: "human",
        kind: detectKind(bullet.text, section.heading),
        key: matchTaxonomyKey(bullet.text) ?? "unkeyed.directive",
        value: bullet.text,
        strength: detectStrength(bullet.text),
        rawRef: `${file.path}:${section.lineOffset + bullet.lineNumber}`,
      });
    }
  }

  if (sections.length === 0) {
    const bullets = extractBullets(file.content);
    for (const bullet of bullets) {
      entries.push({
        id: stableHash(scope, "gemini", bullet.text),
        scope,
        depth,
        source: "gemini",
        authorMode: "human",
        kind: detectKind(bullet.text),
        key: matchTaxonomyKey(bullet.text) ?? "unkeyed.directive",
        value: bullet.text,
        strength: detectStrength(bullet.text),
        rawRef: `${file.path}:${bullet.lineNumber}`,
      });
    }
  }

  return entries;
}

/** Parse .gemini/settings.json files. */
function parseGeminiSettings(file: ContextFile): NormalizedEntry[] {
  const entries: NormalizedEntry[] = [];
  const scope = getScope(file.path);
  const depth = getDepth(scope);

  try {
    const settings = JSON.parse(file.content) as Record<string, unknown>;

    for (const [settingKey, value] of Object.entries(settings)) {
      if (typeof value === "string") {
        entries.push({
          id: stableHash(scope, "gemini", `${settingKey}:${value}`),
          scope,
          depth,
          source: "gemini",
          authorMode: "human",
          kind: detectKind(value),
          key: matchTaxonomyKey(value) ?? "unkeyed.directive",
          value,
          strength: "hard",
          rawRef: `${file.path}:${settingKey}`,
        });
      } else if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          if (typeof value[i] !== "string") continue;
          entries.push({
            id: stableHash(scope, "gemini", `${settingKey}:${value[i]}`),
            scope,
            depth,
            source: "gemini",
            authorMode: "human",
            kind: detectKind(value[i] as string),
            key: matchTaxonomyKey(value[i] as string) ?? "unkeyed.directive",
            value: value[i] as string,
            strength: detectStrength(value[i] as string),
            rawRef: `${file.path}:${settingKey}[${i}]`,
          });
        }
      }
    }
  } catch {
    // Invalid JSON — skip
  }

  return entries;
}

/** Parse any Gemini-related context file. */
export function parseGeminiFile(file: ContextFile): NormalizedEntry[] {
  if (file.path.endsWith(".json")) {
    return parseGeminiSettings(file);
  }
  return parseGeminiMd(file);
}

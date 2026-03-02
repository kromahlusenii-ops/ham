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

/** Parse CLAUDE.md markdown files. */
function parseClaudeMd(file: ContextFile): NormalizedEntry[] {
  const entries: NormalizedEntry[] = [];
  const scope = getScope(file.path);
  const depth = getDepth(scope);

  const sections = extractHeadings(file.content);

  for (const section of sections) {
    const bullets = extractBullets(section.body);
    for (const bullet of bullets) {
      const taxonomyKey = matchTaxonomyKey(bullet.text);
      const strength = detectStrength(bullet.text);
      const kind = detectKind(bullet.text, section.heading);

      entries.push({
        id: stableHash(scope, "claude", bullet.text),
        scope,
        depth,
        source: "claude",
        authorMode: "human",
        kind,
        key: taxonomyKey ?? "unkeyed.directive",
        value: bullet.text,
        strength,
        rawRef: `${file.path}:${section.lineOffset + bullet.lineNumber}`,
      });
    }
  }

  // Fallback: extract bullets from raw content if no sections found
  if (sections.length === 0) {
    const bullets = extractBullets(file.content);
    for (const bullet of bullets) {
      entries.push({
        id: stableHash(scope, "claude", bullet.text),
        scope,
        depth,
        source: "claude",
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

/** Parse .claude/settings.json files. */
function parseClaudeSettings(file: ContextFile): NormalizedEntry[] {
  const entries: NormalizedEntry[] = [];
  const scope = getScope(file.path);
  const depth = getDepth(scope);

  try {
    const settings = JSON.parse(file.content) as Record<string, unknown>;

    if (typeof settings.system_prompt === "string") {
      entries.push({
        id: stableHash(scope, "claude", "system_prompt"),
        scope,
        depth,
        source: "claude",
        authorMode: "human",
        kind: "directive",
        key: "unkeyed.directive",
        value: settings.system_prompt,
        strength: "hard",
        rawRef: `${file.path}:system_prompt`,
      });
    }

    // Extract rules arrays
    for (const rulesKey of ["rules", "project_rules"]) {
      if (Array.isArray(settings[rulesKey])) {
        for (let i = 0; i < (settings[rulesKey] as string[]).length; i++) {
          const rule = (settings[rulesKey] as string[])[i];
          if (typeof rule !== "string") continue;
          entries.push({
            id: stableHash(scope, "claude", `${rulesKey}:${rule}`),
            scope,
            depth,
            source: "claude",
            authorMode: "human",
            kind: detectKind(rule),
            key: matchTaxonomyKey(rule) ?? "unkeyed.directive",
            value: rule,
            strength: detectStrength(rule),
            rawRef: `${file.path}:${rulesKey}[${i}]`,
          });
        }
      }
    }
  } catch {
    // Invalid JSON — skip
  }

  return entries;
}

/** Parse any Claude-related context file. */
export function parseClaudeFile(file: ContextFile): NormalizedEntry[] {
  if (file.path.endsWith(".json")) {
    return parseClaudeSettings(file);
  }
  return parseClaudeMd(file);
}

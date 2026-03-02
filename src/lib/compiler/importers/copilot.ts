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

/** Parse .github/copilot-instructions.md into normalized entries. */
export function parseCopilotFile(file: ContextFile): NormalizedEntry[] {
  const entries: NormalizedEntry[] = [];
  const scope = getScope(file.path);
  const depth = getDepth(scope);

  const sections = extractHeadings(file.content);

  for (const section of sections) {
    const bullets = extractBullets(section.body);
    for (const bullet of bullets) {
      entries.push({
        id: stableHash(scope, "copilot", bullet.text),
        scope,
        depth,
        source: "copilot",
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
        id: stableHash(scope, "copilot", bullet.text),
        scope,
        depth,
        source: "copilot",
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

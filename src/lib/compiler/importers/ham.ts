import type { ContextFile, NormalizedEntry } from "../types";
import {
  extractHeadings,
  extractBullets,
  detectStrength,
  detectKind,
  matchTaxonomyKey,
  stableHash,
  parseFrontmatter,
  getScope,
  getDepth,
} from "./parse-utils";

/** Parse HAM markdown files (.ham/ directory) into normalized entries. */
export function parseHamFile(file: ContextFile): NormalizedEntry[] {
  const entries: NormalizedEntry[] = [];
  const scope = getScope(file.path);
  const depth = getDepth(scope);
  const { frontmatter, body } = parseFrontmatter(file.content);

  // Frontmatter keys map directly to taxonomy
  if (frontmatter.keys && Array.isArray(frontmatter.keys)) {
    for (const key of frontmatter.keys as string[]) {
      entries.push({
        id: stableHash(scope, "ham", `fm:${key}`),
        scope,
        depth,
        source: "ham",
        authorMode: "human",
        kind: "constraint",
        key,
        value: true,
        strength: "hard",
        rawRef: `${file.path}:frontmatter`,
      });
    }
  }

  // Body text: headings + bullets extraction
  const sections = extractHeadings(body);

  for (const section of sections) {
    const bullets = extractBullets(section.body);
    for (const bullet of bullets) {
      const taxonomyKey = matchTaxonomyKey(bullet.text);
      const strength = detectStrength(bullet.text);
      const kind = detectKind(bullet.text, section.heading);

      entries.push({
        id: stableHash(scope, "ham", bullet.text),
        scope,
        depth,
        source: "ham",
        authorMode: "human",
        kind,
        key: taxonomyKey ?? "unkeyed.directive",
        value: bullet.text,
        strength,
        rawRef: `${file.path}:${section.lineOffset + bullet.lineNumber}`,
      });
    }
  }

  // If no sections, extract bullets from raw body
  if (sections.length === 0) {
    const bullets = extractBullets(body);
    for (const bullet of bullets) {
      const taxonomyKey = matchTaxonomyKey(bullet.text);
      entries.push({
        id: stableHash(scope, "ham", bullet.text),
        scope,
        depth,
        source: "ham",
        authorMode: "human",
        kind: detectKind(bullet.text),
        key: taxonomyKey ?? "unkeyed.directive",
        value: bullet.text,
        strength: detectStrength(bullet.text),
        rawRef: `${file.path}:${bullet.lineNumber}`,
      });
    }
  }

  return entries;
}

import { parse as parseYaml } from "yaml";
import type { ContextFile, NormalizedEntry } from "../types";
import {
  detectStrength,
  matchTaxonomyKey,
  stableHash,
  getScope,
  getDepth,
} from "./parse-utils";

/** Parse .aider.conf.yml YAML config files. */
function parseAiderYaml(file: ContextFile): NormalizedEntry[] {
  const entries: NormalizedEntry[] = [];
  const scope = getScope(file.path);
  const depth = getDepth(scope);

  try {
    const config = parseYaml(file.content) as Record<string, unknown>;
    if (!config || typeof config !== "object") return entries;

    for (const [yamlKey, value] of Object.entries(config)) {
      const stringVal = typeof value === "string" ? value : JSON.stringify(value);
      const taxonomyKey = matchTaxonomyKey(yamlKey) ?? matchTaxonomyKey(stringVal);

      entries.push({
        id: stableHash(scope, "aider", `${yamlKey}:${stringVal}`),
        scope,
        depth,
        source: "aider",
        authorMode: "human",
        kind: "directive",
        key: taxonomyKey ?? "unkeyed.directive",
        value: stringVal,
        strength: "hard",
        rawRef: `${file.path}:${yamlKey}`,
      });
    }
  } catch {
    // Invalid YAML — skip
  }

  return entries;
}

/** Parse .aiderignore as exclusion list. */
function parseAiderIgnore(file: ContextFile): NormalizedEntry[] {
  const entries: NormalizedEntry[] = [];
  const scope = getScope(file.path);
  const depth = getDepth(scope);

  const lines = file.content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;

    entries.push({
      id: stableHash(scope, "aider", `ignore:${line}`),
      scope,
      depth,
      source: "aider",
      authorMode: "human",
      kind: "constraint",
      key: "unkeyed.directive",
      value: `exclude: ${line}`,
      strength: "hard",
      rawRef: `${file.path}:${i + 1}`,
    });
  }

  return entries;
}

/** Parse any Aider-related context file. */
export function parseAiderFile(file: ContextFile): NormalizedEntry[] {
  if (file.path.endsWith(".aiderignore") || file.path.includes("aiderignore")) {
    return parseAiderIgnore(file);
  }
  if (file.path.endsWith(".yml") || file.path.endsWith(".yaml")) {
    return parseAiderYaml(file);
  }
  return [];
}

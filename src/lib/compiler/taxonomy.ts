// ── MMHCS Taxonomy — 21 canonical keys for cross-tool normalization ──

export interface TaxonomyKey {
  domain: "style" | "architecture" | "testing" | "data" | "repo";
  key: string;
  patterns: RegExp[];
  enumValues?: string[];
}

export const TAXONOMY: Record<string, TaxonomyKey> = {
  // ── Style ──────────────────────────────────────────────────────────
  "naming.convention": {
    domain: "style",
    key: "naming.convention",
    patterns: [/\b(camelCase|snake_case|PascalCase|kebab-case)\b/i, /naming\s*(convention|style)/i],
    enumValues: ["camelCase", "snake_case", "PascalCase", "kebab-case"],
  },
  "indent.style": {
    domain: "style",
    key: "indent.style",
    patterns: [/\b(tabs?|spaces?)\b.*indent/i, /indent.*\b(tabs?|spaces?)\b/i],
    enumValues: ["tabs", "spaces"],
  },
  "indent.size": {
    domain: "style",
    key: "indent.size",
    patterns: [/indent.*\b([24])\s*(spaces?|width)/i, /\b([24])\s*space\s*indent/i],
  },
  "quote.style": {
    domain: "style",
    key: "quote.style",
    patterns: [/\b(single|double)\s*quotes?\b/i, /quotes?\s*(single|double)/i],
    enumValues: ["single", "double"],
  },
  "semicolons": {
    domain: "style",
    key: "semicolons",
    patterns: [/\b(no\s*semi|semicolons?)\b/i],
    enumValues: ["always", "never"],
  },
  "import.style": {
    domain: "style",
    key: "import.style",
    patterns: [/\b(named\s*exports?|default\s*exports?|barrel\s*exports?)\b/i],
    enumValues: ["named", "default", "barrel"],
  },
  "comment.style": {
    domain: "style",
    key: "comment.style",
    patterns: [/\b(jsdoc|tsdoc|inline\s*comments?)\b/i],
  },

  // ── Architecture ───────────────────────────────────────────────────
  "component.pattern": {
    domain: "architecture",
    key: "component.pattern",
    patterns: [/\b(functional|class)\s*components?\b/i, /\bprefer\s*(functional|class)\b/i],
    enumValues: ["functional", "class"],
  },
  "state.management": {
    domain: "architecture",
    key: "state.management",
    patterns: [/\b(redux|zustand|context|jotai|recoil|mobx)\b/i],
  },
  "api.style": {
    domain: "architecture",
    key: "api.style",
    patterns: [/\b(REST|GraphQL|tRPC|gRPC)\b/i],
    enumValues: ["REST", "GraphQL", "tRPC", "gRPC"],
  },
  "error.handling": {
    domain: "architecture",
    key: "error.handling",
    patterns: [/error\s*(handling|boundary|format)/i, /\b(try[/-]catch|Result\s*type|error\s*boundary)\b/i],
  },
  "async.pattern": {
    domain: "architecture",
    key: "async.pattern",
    patterns: [/\b(async[/-]await|promises?|callbacks?|\.then\(\))\b/i],
    enumValues: ["async-await", "promises", "callbacks"],
  },
  "file.structure": {
    domain: "architecture",
    key: "file.structure",
    patterns: [/\b(co-?locate|barrel|feature[/-]based|atomic\s*design)\b/i],
  },
  "dependency.injection": {
    domain: "architecture",
    key: "dependency.injection",
    patterns: [/\bdependency\s*injection\b/i, /\b(DI|IoC)\s*(container|pattern)?\b/],
  },

  // ── Testing ────────────────────────────────────────────────────────
  "test.framework": {
    domain: "testing",
    key: "test.framework",
    patterns: [/\b(jest|vitest|mocha|pytest|testing[/-]library)\b/i],
  },
  "test.pattern": {
    domain: "testing",
    key: "test.pattern",
    patterns: [/\b(unit\s*test|integration\s*test|e2e|end[/-]to[/-]end|snapshot)\b/i],
  },
  "test.coverage": {
    domain: "testing",
    key: "test.coverage",
    patterns: [/\b(coverage|100%|code\s*coverage)\b/i],
  },

  // ── Data ───────────────────────────────────────────────────────────
  "orm": {
    domain: "data",
    key: "orm",
    patterns: [/\b(prisma|drizzle|typeorm|sequelize|sqlalchemy|django\s*orm)\b/i],
  },
  "validation": {
    domain: "data",
    key: "validation",
    patterns: [/\b(zod|yup|joi|ajv|class[/-]validator)\b/i],
  },

  // ── Repo ───────────────────────────────────────────────────────────
  "language": {
    domain: "repo",
    key: "language",
    patterns: [/\b(TypeScript|JavaScript|Python|Rust|Go|Java|Ruby)\b/i],
  },
  "framework": {
    domain: "repo",
    key: "framework",
    patterns: [/\b(Next\.?js|React|Vue|Angular|Express|FastAPI|Django|Rails)\b/i],
  },
} as const;

/** Attempt to match a line of text against all taxonomy keys. Returns matched key or null. */
export function matchTaxonomyKey(line: string): string | null {
  for (const [key, def] of Object.entries(TAXONOMY)) {
    for (const pattern of def.patterns) {
      if (pattern.test(line)) return key;
    }
  }
  return null;
}

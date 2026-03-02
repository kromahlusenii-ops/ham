import type { MemoryFile } from "./types";

function mockFile(
  id: string,
  repoId: string,
  path: string,
  fileType: MemoryFile["file_type"],
  sizeBytes: number,
  content: string,
): MemoryFile {
  return {
    id,
    repo_id: repoId,
    path,
    file_type: fileType,
    sha: `mock-sha-${id}`,
    size_bytes: sizeBytes,
    token_count: Math.ceil(sizeBytes / 4),
    content,
    last_scanned_at: "2026-02-28T12:00:00Z",
  };
}

const hamFiles: MemoryFile[] = [
  mockFile("mf-1", "mock-1", "CLAUDE.md", "claude", 1648, `# HAM Landing Page

## Stack
- Next.js 16 (App Router, TypeScript, Turbopack)
- Tailwind CSS v4 (CSS-first \`@theme\` config)
- Framer Motion (scroll-reveal animations)
- Lucide React (icons)

## Rules
- All components use "use client" only when they need browser APIs or hooks
- Green/forest color palette — tokens defined in \`globals.css\` via \`@theme inline\`
- Copy and data live in \`src/lib/constants.ts\` — components import, never hardcode`),

  mockFile("mf-2", "mock-1", "src/CLAUDE.md", "claude", 420, `# Source Context

## Conventions
- Feature code lives here
- Shared utilities in \`lib/\`
- Components in \`components/\``),

  mockFile("mf-3", "mock-1", "src/components/CLAUDE.md", "claude", 680, `# Components Context

## Conventions
- Page sections: Header, Hero, Problem, HowItWorks, Features, Pricing
- Shared UI primitives in \`ui/\` subfolder
- "use client" only on components using hooks or motion`),

  mockFile("mf-4", "mock-1", "src/lib/CLAUDE.md", "claude", 340, `# Lib Context

## Conventions
- \`constants.ts\` — all marketing copy and data
- \`animations.ts\` — Framer Motion variant presets
- All arrays use \`as const\` for type narrowing`),

  mockFile("mf-5", "mock-1", "src/app/CLAUDE.md", "claude", 512, `# App Context

## Conventions
- \`layout.tsx\` sets fonts, metadata, and OG tags
- \`globals.css\` defines design tokens via \`@theme inline\`
- \`page.tsx\` composes section components — no logic here`),

  mockFile("mf-6", "mock-1", ".cursorrules", "cursor", 256, `# Cursor Rules
- Use TypeScript strict mode
- Prefer functional components
- Always use Tailwind for styling
- Import from @/ path aliases`),
];

const acmeFiles: MemoryFile[] = [
  mockFile("mf-7", "mock-2", "CLAUDE.md", "claude", 920, `# Acme API

## Stack
- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- Jest for testing

## Rules
- All endpoints require auth middleware
- Use Zod for request validation
- Return consistent error format: { error: string, code: number }`),

  mockFile("mf-8", "mock-2", ".github/copilot-instructions.md", "copilot", 480, `# Copilot Instructions
- Generate TypeScript, not JavaScript
- Always add JSDoc comments to public functions
- Use async/await instead of .then() chains
- Prefer named exports over default exports`),

  mockFile("mf-9", "mock-2", "AGENTS.md", "agents", 360, `# Agent Guidelines
- Run \`npm test\` before committing
- Check for breaking changes in API endpoints
- Update OpenAPI spec when modifying routes
- Follow semantic versioning for releases`),

  mockFile("mf-10", "mock-2", "src/CLAUDE.md", "claude", 280, `# Source Context
- Controllers in \`controllers/\`
- Middleware in \`middleware/\`
- Database models in \`models/\`
- Shared utilities in \`utils/\``),

  mockFile("mf-14", "mock-2", "GEMINI.md", "gemini", 400, `# Gemini Agent Config
- Use structured output for all API responses
- Prefer grounding with Google Search when available
- Follow OpenAPI spec for endpoint generation
- Always validate request schemas with Zod`),

  mockFile("mf-16", "mock-2", ".ham/context.md", "ham", 320, `---
keys: [naming.convention, async.pattern]
---

# Acme API Context

## Architecture
- MUST use camelCase for all identifiers
- MUST use async/await pattern for all async operations
- Prefer named exports over default exports`),

  mockFile("mf-17", "mock-2", ".ham/api-rules.md", "ham", 240, `# API Rules

## Constraints
- NEVER return raw database errors to clients
- MUST validate all request bodies with Zod
- SHOULD use pagination for list endpoints`),
];

const designSystemFiles: MemoryFile[] = [
  mockFile("mf-11", "mock-3", "CLAUDE.md", "claude", 740, `# Design System

## Stack
- React 19 + TypeScript
- Storybook for component development
- Tailwind CSS for styling
- Vitest + Testing Library

## Rules
- Every component must have a Storybook story
- Props interfaces exported alongside components
- Use CSS variables for theming, not hardcoded colors`),

  mockFile("mf-12", "mock-3", ".windsurfrules", "windsurf", 320, `# Windsurf Rules
- Always generate accessible components (ARIA labels)
- Use forwardRef for all interactive elements
- Include TypeScript generics where applicable
- Prefer composition over inheritance`),

  mockFile("mf-13", "mock-3", "src/components/CLAUDE.md", "claude", 440, `# Component Guidelines
- Atomic design: atoms → molecules → organisms
- Each component gets its own directory with index.ts barrel
- Co-locate styles, tests, and stories with components
- Use \`cn()\` utility for conditional class merging`),

  mockFile("mf-15", "mock-3", ".gemini/styleguide.md", "gemini", 360, `# Gemini Style Guide
- Generate accessible markup with ARIA attributes
- Use design tokens from the theme config
- Prefer CSS Grid for layout, Flexbox for alignment
- Include dark mode variants for all components`),
];

export const MOCK_MEMORY_FILES: Record<string, MemoryFile[]> = {
  "mock-1": hamFiles,
  "mock-2": acmeFiles,
  "mock-3": designSystemFiles,
};

export const MOCK_INIT_PREVIEW = {
  filesToCreate: [
    {
      path: "CLAUDE.md",
      content: `# design-system\nShared React component library\n\n## Stack\n<!-- Fill in your project's tech stack -->\n\n## Rules\n<!-- Add project-specific rules for AI agents -->`,
    },
    {
      path: ".ham/config.json",
      content: `{\n  "hamVersion": "1.0.0",\n  "enabledImporters": ["ham", "claude", "cursor", "gemini", "aider", "copilot", "llama", "manus"],\n  "precedencePreset": "target-first",\n  "defaultBudget": 2000,\n  "ignoredPaths": ["node_modules", ".git", "dist", "build", ".next"],\n  "taxonomyVersion": "1.0.0"\n}`,
    },
    {
      path: ".memory/decisions.md",
      content: `# Architecture Decision Records\n\n## Template\n\n### ADR-NNN: Title\n- **Status**: proposed | accepted | superseded\n- **Date**: YYYY-MM-DD`,
    },
    {
      path: ".memory/patterns.md",
      content: `# Patterns & Conventions\n\n## Template\n\n### Pattern: Name\n- **When**: When to apply this pattern`,
    },
    {
      path: ".memory/inbox.md",
      content: `# Inbox — Unverified Observations\n\n> Items here are uncertain inferences from AI agents.`,
    },
  ],
  existingFiles: [".windsurfrules", "src/components/CLAUDE.md"],
};

export const NAV_LINKS = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Sustainability", href: "#sustainability" },
] as const;

export const HERO_STATS = [
  { value: "50%", label: "fewer tokens" },
  { value: "3x", label: "faster context" },
  { value: "$0", label: "to start" },
] as const;

export const PAIN_POINTS = [
  {
    title: "Bloated context windows",
    description:
      "A single monolithic memory file balloons to thousands of tokens — most of which are irrelevant to the current task. Every agent pays the cost.",
  },
  {
    title: "Wasted compute & cost",
    description:
      "Every request re-sends the same stale instructions, burning tokens and money on context the model never needed.",
  },
  {
    title: "Fragile, hard-to-maintain",
    description:
      "One giant file means constant merge conflicts, stale sections, and no clear ownership across teams.",
  },
] as const;

export const TOKEN_COMPARISON = {
  before: {
    label: "Monolithic memory file",
    tokens: "12,847",
    files: 1,
    description: "Everything in one file, loaded by every agent, every request",
  },
  after: {
    label: "HAM Scoped Files",
    tokens: "6,424",
    files: 7,
    description: "Only relevant context loaded per task, per agent",
  },
} as const;

export const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    title: "Scope your memory files",
    description:
      "Place scoped memory files in each directory. Each file contains only the context relevant to that part of your codebase. Works with any AI coding agent.",
    code: `project/
├── CLAUDE.md            # Project-wide rules
├── src/
│   ├── CLAUDE.md        # Source conventions
│   ├── api/
│   │   └── CLAUDE.md    # API patterns
│   └── components/
│       └── CLAUDE.md    # Component guidelines
└── tests/
    └── CLAUDE.md        # Testing standards`,
  },
  {
    step: "02",
    title: "Each agent loads only what's relevant",
    description:
      "When an agent works in src/api/, it walks the directory tree and loads only the memory files on the path — root down to the working directory. Nothing outside scope is ever sent, regardless of which agent is running.",
    code: `# Working in src/api/handlers.ts

Loaded memory (3 files, 1,247 tokens):
  ✓ /CLAUDE.md           →  412 tokens
  ✓ /src/CLAUDE.md       →  389 tokens
  ✓ /src/api/CLAUDE.md   →  446 tokens

Skipped (not in scope):
  ✗ /tests/CLAUDE.md
  ✗ /src/components/CLAUDE.md`,
  },
  {
    step: "03",
    title: "Self-maintaining & composable",
    description:
      "HAM files stay small and focused. Teams own their directories. No merge conflicts, no stale context, no token bloat.",
    code: `# HAM automatically validates:
✓ No duplicate rules across scopes
✓ Child files don't contradict parents
✓ Token budget per file: < 2,000
✓ Staleness check: flag files > 30 days

$ ham stats
  Total files:    7
  Total tokens:   3,412
  Avg per file:   487
  Savings:        50.2%`,
  },
] as const;

export const FEATURES = {
  community: {
    title: "Community",
    badge: "Free & Open Source",
    features: [
      "Hierarchical memory file scoping",
      "Automatic scoped context loading",
      "Token usage analytics",
      "CLI tooling (ham init, ham stats)",
      "VS Code extension",
      "Community support via GitHub",
      "MIT licensed",
    ],
  },
  pro: {
    title: "Pro",
    badge: "For Teams",
    features: [
      "Everything in Community, plus:",
      "Any-agent support (Cursor, Copilot, Windsurf, etc.)",
      "Multi-agent token observability",
      "Team member usage comparison",
      "Team memory sharing & sync",
      "Role-based access control",
      "Memory versioning & rollback",
      "CI/CD integration hooks",
      "Analytics dashboard",
      "Slack & email support",
      "SOC 2 compliance",
    ],
  },
} as const;

export const PRICING = {
  community: {
    name: "Community",
    price: "$0",
    period: "forever",
    description: "For individual developers and open-source projects.",
    cta: "Get Started",
    ctaHref: "https://github.com/kromahlusenii-ops/ham",
    highlighted: false,
    features: [
      "Unlimited memory files",
      "Full CLI tooling",
      "VS Code extension",
      "Token analytics",
      "Community support",
    ],
  },
  pro: {
    name: "Pro",
    price: "$49",
    period: "per seat / month",
    description: "For teams using any AI coding agent — Claude, Cursor, Copilot, and more.",
    cta: "Join Waitlist",
    ctaHref: "#waitlist",
    highlighted: true,
    features: [
      "Everything in Community",
      "Any-agent support",
      "Multi-agent observability",
      "Team member comparison",
      "Team memory sync",
      "Role-based access",
      "CI/CD hooks",
      "Priority support",
      "SOC 2 compliant",
    ],
  },
} as const;

export const SUSTAINABILITY_STATS = [
  {
    value: 2400000,
    suffix: "+",
    label: "Tokens saved daily",
    description: "Across the HAM community",
  },
  {
    value: 847,
    suffix: "kg",
    label: "CO₂ reduced monthly",
    description: "Less compute = smaller carbon footprint",
  },
  {
    value: 50,
    suffix: "%",
    label: "Context reduction",
    description: "Average token savings per request",
  },
] as const;

export const FOOTER_LINKS = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Documentation", href: "#" },
    { label: "Changelog", href: "#" },
  ],
  Community: [
    { label: "GitHub", href: "https://github.com/kromahlusenii-ops/ham" },
    { label: "Discord", href: "#" },
    { label: "Twitter", href: "#" },
    { label: "Blog", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
  ],
  Resources: [
    { label: "Getting Started", href: "#" },
    { label: "API Reference", href: "#" },
    { label: "Examples", href: "#" },
    { label: "Support", href: "#" },
  ],
} as const;

"use client";

import { motion } from "framer-motion";
import { fadeInUp, stagger } from "@/lib/animations";
import SectionWrapper from "@/components/ui/SectionWrapper";
import CodeBlock from "@/components/ui/CodeBlock";
import {
  DOCS_SUPPORTED_TOOLS,
  DOCS_CLI_COMMANDS,
  DOCS_CONFIG_FIELDS,
  DOCS_PRECEDENCE_PRESETS,
} from "@/lib/constants";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-widest text-ash">
      {children}
    </p>
  );
}

function SectionHeading({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <motion.h2
      id={id}
      variants={fadeInUp}
      className="mt-3 text-3xl font-bold tracking-tight text-ink scroll-mt-20"
    >
      {children}
    </motion.h2>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={fadeInUp}
      className={`rounded-lg border border-stone bg-white p-6 ${className}`}
    >
      {children}
    </motion.div>
  );
}

export default function DocsContent() {
  return (
    <>
      {/* ── 1. Overview ────────────────────────────────────────────── */}
      <section id="overview" className="scroll-mt-20 px-6 pb-12 pt-10 sm:px-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="mx-auto max-w-5xl"
        >
          <motion.div variants={fadeInUp}>
            <Eyebrow>HAM Pro</Eyebrow>
          </motion.div>
          <motion.h1
            variants={fadeInUp}
            className="mt-3 text-3xl font-bold tracking-tight text-ink"
          >
            One context layer for every AI tool in your repo.
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            className="mt-4 max-w-2xl text-lg text-gray"
          >
            HAM Pro reads the config files you already have, finds where they
            conflict, and compiles clean, scoped context bundles for whichever
            tool you&apos;re using. It never touches your files.
          </motion.p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <Card>
              <h3 className="font-semibold text-ink">Read-Only by Default</h3>
              <p className="mt-2 text-sm text-gray">
                HAM reads your existing tool configs. It never modifies them
                unless you explicitly ask.
              </p>
            </Card>
            <Card>
              <h3 className="font-semibold text-ink">Conflict Detection</h3>
              <p className="mt-2 text-sm text-gray">
                Using multiple AI tools? HAM finds where your rules disagree
                and shows you exactly what&apos;s conflicting and why.
              </p>
            </Card>
            <Card>
              <h3 className="font-semibold text-ink">Zero Lock-In</h3>
              <p className="mt-2 text-sm text-gray">
                One command to remove HAM completely. Your repo is exactly how
                it was before.
              </p>
            </Card>
          </div>
        </motion.div>
      </section>

      {/* ── 2. Quick Start ─────────────────────────────────────────── */}
      <SectionWrapper id="quick-start" className="bg-snow">
        <motion.div variants={fadeInUp}>
          <Eyebrow>Getting Started</Eyebrow>
        </motion.div>
        <SectionHeading>Quick Start</SectionHeading>
        <motion.p variants={fadeInUp} className="mt-4 max-w-2xl text-gray">
          Three commands to get started.
        </motion.p>

        <motion.div variants={fadeInUp} className="mt-8">
          <CodeBlock title="Terminal">{`# Scan your repo for existing AI tool configs
ham init --scan

# Compile context for a file you're working on
ham compile --path src/api/routes/auth.ts --target cursor

# See conflicts, sources, and token usage
ham report --last`}</CodeBlock>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          className="mt-6 rounded-lg border border-accent/20 bg-accent/5 p-5"
        >
          <p className="text-sm text-gray">
            <span className="font-medium text-ink">Note: </span>
            <code className="font-mono text-[13px] text-accent">ham init</code>{" "}
            scans your repo and creates{" "}
            <code className="font-mono text-[13px] text-accent">.ham/config.json</code>.
            It does not modify any of your existing tool files.
          </p>
        </motion.div>
      </SectionWrapper>

      {/* ── 3. Supported Tools ─────────────────────────────────────── */}
      <SectionWrapper id="supported-tools">
        <motion.div variants={fadeInUp}>
          <Eyebrow>Compatibility</Eyebrow>
        </motion.div>
        <SectionHeading>Supported Tools</SectionHeading>
        <motion.p variants={fadeInUp} className="mt-4 max-w-2xl text-gray">
          HAM Pro works with the tools you already use.
        </motion.p>

        <motion.div variants={fadeInUp} className="mt-8">
          <div className="overflow-x-auto rounded-lg border border-stone bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone bg-snow">
                  <th className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-widest text-ash">
                    Tool
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-widest text-ash">
                    Config Files
                  </th>
                </tr>
              </thead>
              <tbody>
                {DOCS_SUPPORTED_TOOLS.map((row) => (
                  <tr key={row.tool} className="border-b border-stone last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">{row.tool}</td>
                    <td className="px-4 py-3 font-mono text-[13px] text-gray">
                      {row.files}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          className="mt-6 rounded-lg border border-accent/20 bg-accent/5 p-5"
        >
          <p className="text-sm text-gray">
            HAM also uses its own{" "}
            <code className="font-mono text-[13px] text-accent">.ham/</code>{" "}
            directory for canonical context that applies across all tools. You
            can write HAM context files at any directory level in your project.
          </p>
        </motion.div>
      </SectionWrapper>

      {/* ── 4. How It Works ────────────────────────────────────────── */}
      <SectionWrapper id="how-it-works" className="bg-snow">
        <motion.div variants={fadeInUp}>
          <Eyebrow>Concepts</Eyebrow>
        </motion.div>
        <SectionHeading>How It Works</SectionHeading>
        <motion.p variants={fadeInUp} className="mt-4 max-w-2xl text-gray">
          HAM Pro is a context compiler. Point it at a file you&apos;re editing
          and tell it which tool you&apos;re compiling for. HAM walks up your
          directory tree, collects context from every supported config file it
          finds, resolves conflicts intelligently, and gives you a single
          optimized bundle.
        </motion.p>

        <motion.div variants={fadeInUp} className="mt-10">
          <CodeBlock title="Example: directory tree">{`my-project/
├── .cursorrules
├── .claude/
│   └── CLAUDE.md
├── .ham/
│   ├── config.json
│   └── context.md
└── src/
    ├── .ham/
    │   └── context.md
    └── api/
        ├── .cursorrules
        └── routes/
            └── auth.ts       ← compiling for this file`}</CodeBlock>
        </motion.div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Card>
            <h3 className="font-semibold text-ink">Hierarchical scoping</h3>
            <p className="mt-2 text-sm text-gray">
              Context files deeper in your directory tree take priority over
              ones higher up. If your root{" "}
              <code className="font-mono text-[12px] text-accent">.cursorrules</code>{" "}
              says one thing and{" "}
              <code className="font-mono text-[12px] text-accent">src/api/.cursorrules</code>{" "}
              says another, the deeper one wins for files in that directory.
            </p>
          </Card>
          <Card>
            <h3 className="font-semibold text-ink">Cross-tool awareness</h3>
            <p className="mt-2 text-sm text-gray">
              HAM reads configs from all your tools at once, so it can spot
              when Cursor says &quot;use camelCase&quot; but your Claude config
              says &quot;use snake_case.&quot; You see the conflict instead of
              getting inconsistent AI behavior across tools.
            </p>
          </Card>
          <Card>
            <h3 className="font-semibold text-ink">Target-aware compilation</h3>
            <p className="mt-2 text-sm text-gray">
              When you compile for a specific tool, HAM prioritizes that
              tool&apos;s human-authored rules. Your{" "}
              <code className="font-mono text-[12px] text-accent">.cursorrules</code>{" "}
              take the lead when compiling for Cursor. Your Claude config leads
              when compiling for Claude. HAM&apos;s own context fills the gaps.
            </p>
          </Card>
          <Card>
            <h3 className="font-semibold text-ink">Token budgets</h3>
            <p className="mt-2 text-sm text-gray">
              Compiled bundles respect a configurable token limit. HAM
              prioritizes the most important constraints and deduplicates
              redundant context so your AI tool gets exactly what it needs
              without the noise.
            </p>
          </Card>
        </div>
      </SectionWrapper>

      {/* ── 5. CLI Reference ───────────────────────────────────────── */}
      <SectionWrapper id="cli-reference">
        <motion.div variants={fadeInUp}>
          <Eyebrow>Reference</Eyebrow>
        </motion.div>
        <SectionHeading>CLI Reference</SectionHeading>

        <div className="mt-10 space-y-6">
          {DOCS_CLI_COMMANDS.map((cmd) => (
            <motion.div
              key={cmd.command}
              variants={fadeInUp}
              className="rounded-lg border border-stone bg-white p-5"
            >
              <code className="font-mono text-[14px] font-medium text-accent">
                {cmd.command}
              </code>
              <p className="mt-2 text-sm text-gray">{cmd.description}</p>
            </motion.div>
          ))}
        </div>
      </SectionWrapper>

      {/* ── 6. Configuration ───────────────────────────────────────── */}
      <SectionWrapper id="configuration" className="bg-snow">
        <motion.div variants={fadeInUp}>
          <Eyebrow>Settings</Eyebrow>
        </motion.div>
        <SectionHeading>Configuration</SectionHeading>
        <motion.p variants={fadeInUp} className="mt-4 max-w-2xl text-gray">
          All settings live in{" "}
          <code className="font-mono text-[13px] text-accent">.ham/config.json</code>,
          created when you run{" "}
          <code className="font-mono text-[13px] text-accent">ham init</code>.
        </motion.p>

        <motion.div variants={fadeInUp} className="mt-8">
          <CodeBlock title=".ham/config.json">{`{
  "ham_version": "1.0",
  "enabled_importers": [
    "ham", "cursor", "claude",
    "gemini", "aider", "copilot"
  ],
  "precedence_preset": "target-first",
  "default_budget": 2000,
  "ignored_paths": ["legacy/", "vendor/"]
}`}</CodeBlock>
        </motion.div>

        <motion.div variants={fadeInUp} className="mt-8">
          <div className="overflow-x-auto rounded-lg border border-stone bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone bg-snow">
                  <th className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-widest text-ash">
                    Field
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-widest text-ash">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {DOCS_CONFIG_FIELDS.map((row) => (
                  <tr key={row.field} className="border-b border-stone last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-[13px] text-accent">
                      {row.field}
                    </td>
                    <td className="px-4 py-3 text-gray">{row.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Precedence Presets */}
        <motion.div variants={fadeInUp} className="mt-10">
          <h3
            id="precedence-presets"
            className="scroll-mt-20 text-xl font-semibold text-ink"
          >
            Precedence Presets
          </h3>
        </motion.div>

        <motion.div variants={fadeInUp} className="mt-4">
          <div className="overflow-x-auto rounded-lg border border-stone bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone bg-snow">
                  <th className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-widest text-ash">
                    Preset
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-widest text-ash">
                    What It Does
                  </th>
                </tr>
              </thead>
              <tbody>
                {DOCS_PRECEDENCE_PRESETS.map((row) => (
                  <tr key={row.preset} className="border-b border-stone last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-[13px] text-accent">
                      {row.preset}
                    </td>
                    <td className="px-4 py-3 text-gray">{row.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </SectionWrapper>

      {/* ── 7. Trust & Safety ──────────────────────────────────────── */}
      <SectionWrapper id="trust-safety">
        <motion.div variants={fadeInUp}>
          <Eyebrow>Principles</Eyebrow>
        </motion.div>
        <SectionHeading>Trust &amp; Safety</SectionHeading>
        <motion.p variants={fadeInUp} className="mt-4 max-w-2xl text-gray">
          HAM Pro is built on a simple promise: your repo, your rules, your
          control.
        </motion.p>

        <div className="mt-10 space-y-4">
          <Card>
            <h3 className="font-semibold text-ink">Your files are safe</h3>
            <p className="mt-2 text-sm text-gray">
              HAM never modifies{" "}
              <code className="font-mono text-[12px] text-accent">.cursorrules</code>,{" "}
              <code className="font-mono text-[12px] text-accent">.claude/</code>,{" "}
              <code className="font-mono text-[12px] text-accent">.gemini/</code>,{" "}
              <code className="font-mono text-[12px] text-accent">.aider.conf.yml</code>,
              or{" "}
              <code className="font-mono text-[12px] text-accent">.github/copilot-instructions.md</code>{" "}
              unless you explicitly run{" "}
              <code className="font-mono text-[12px] text-accent">ham export</code>.
              Compile and report are always read-only operations.
            </p>
          </Card>
          <Card>
            <h3 className="font-semibold text-ink">No surprises</h3>
            <p className="mt-2 text-sm text-gray">
              Same inputs, same output, every time. HAM&apos;s compilation is
              deterministic. You can predict what it will produce.
            </p>
          </Card>
          <Card>
            <h3 className="font-semibold text-ink">Nothing hidden</h3>
            <p className="mt-2 text-sm text-gray">
              Every conflict is surfaced. HAM never silently drops a rule or
              picks one over another without telling you. The report shows
              exactly what happened.
            </p>
          </Card>
          <Card>
            <h3 className="font-semibold text-ink">Nothing leaves your machine</h3>
            <p className="mt-2 text-sm text-gray">
              Compilation happens locally. Your context files, config, and
              compiled bundles stay in your repo under your version control.
            </p>
          </Card>
        </div>
      </SectionWrapper>

      {/* ── 8. Eject & Cancellation ────────────────────────────────── */}
      <SectionWrapper id="eject" className="bg-snow">
        <motion.div variants={fadeInUp}>
          <Eyebrow>Off-Ramp</Eyebrow>
        </motion.div>
        <SectionHeading>Eject &amp; Cancellation</SectionHeading>
        <motion.p variants={fadeInUp} className="mt-4 max-w-2xl text-gray">
          HAM is designed to be easy to leave. Your repo should work exactly
          the same without HAM as it did before.
        </motion.p>

        <motion.div variants={fadeInUp} className="mt-8">
          <CodeBlock title="Terminal">{`# Keep your .ham/ files, just remove Pro features
ham eject

# Remove everything, including .ham/ directory
ham eject --full`}</CodeBlock>
        </motion.div>

        <div className="mt-8 space-y-4">
          <Card>
            <h3 className="font-semibold text-ink">What eject does</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray">
              <li className="flex gap-2">
                <span className="text-accent">-</span>
                Strips{" "}
                <code className="font-mono text-[12px] text-accent">HAM:BEGIN</code>
                {" / "}
                <code className="font-mono text-[12px] text-accent">HAM:END</code>{" "}
                marker blocks from any tool files (if you used{" "}
                <code className="font-mono text-[12px] text-accent">ham export</code>)
              </li>
              <li className="flex gap-2">
                <span className="text-accent">-</span>
                Leaves your{" "}
                <code className="font-mono text-[12px] text-accent">.ham/</code>{" "}
                directory and the context files you wrote (unless using{" "}
                <code className="font-mono text-[12px] text-accent">--full</code>)
              </li>
              <li className="flex gap-2">
                <span className="text-accent">-</span>
                Prints a summary of exactly what was removed
              </li>
            </ul>
          </Card>

          <Card>
            <h3 className="font-semibold text-ink">If your subscription lapses</h3>
            <p className="mt-2 text-sm text-gray">
              Pro features pause. Nothing breaks and nothing is deleted. HAM
              continues working with your{" "}
              <code className="font-mono text-[12px] text-accent">.ham/</code>{" "}
              files at the free tier. Your last compiled bundles still exist in{" "}
              <code className="font-mono text-[12px] text-accent">.ham/compiled/</code>.
              When you re-subscribe, everything picks back up immediately with
              no re-setup.
            </p>
          </Card>
        </div>

        <motion.div
          variants={fadeInUp}
          className="mt-10 rounded-lg border border-accent/20 bg-accent/5 p-6 text-center"
        >
          <p className="text-sm font-medium text-ink">
            HAM fully removed. Your tool files were never modified.
          </p>
        </motion.div>
      </SectionWrapper>
    </>
  );
}

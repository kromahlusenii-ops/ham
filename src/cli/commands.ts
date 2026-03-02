import * as fs from "fs";
import * as path from "path";
import { discoverLocalFiles, readLocalConfig } from "./local-adapter";
import { compile } from "../lib/compiler/compile";
import { eject } from "../lib/compiler/eject";
import { createDefaultConfig } from "../lib/compiler/config";
import type { Target } from "../lib/compiler/types";

const VALID_TARGETS: Target[] = ["cursor", "claude", "gemini", "aider", "copilot", "llama", "manus", "universal"];

/** `ham init --scan` — Discover files, print report, create .ham/config.json */
export function cmdInit(rootDir: string, flags: { scan?: boolean }) {
  const files = discoverLocalFiles(rootDir);

  console.log(`\nFound ${files.length} context file(s):\n`);
  for (const f of files) {
    console.log(`  ${f.source.padEnd(8)} ${f.path}`);
  }

  if (flags.scan) {
    console.log(`\nScan complete. ${files.length} files discovered.`);
  }

  // Create .ham/config.json if it doesn't exist
  const hamDir = path.join(rootDir, ".ham");
  const configPath = path.join(hamDir, "config.json");

  if (!fs.existsSync(configPath)) {
    if (!fs.existsSync(hamDir)) {
      fs.mkdirSync(hamDir, { recursive: true });
    }
    const config = createDefaultConfig();
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
    console.log(`\nCreated ${path.relative(rootDir, configPath)}`);
  } else {
    console.log(`\n.ham/config.json already exists.`);
  }
}

/** `ham compile --path <file> --target <tool> --budget <n>` */
export function cmdCompile(
  rootDir: string,
  flags: { path?: string; target?: string; budget?: string }
) {
  const targetPath = flags.path ?? "";
  const target = (flags.target ?? "universal") as Target;
  const budget = flags.budget ? parseInt(flags.budget, 10) : undefined;

  if (!VALID_TARGETS.includes(target)) {
    console.error(`Invalid target "${target}". Must be one of: ${VALID_TARGETS.join(", ")}`);
    process.exit(1);
  }

  const files = discoverLocalFiles(rootDir);
  if (files.length === 0) {
    console.error("No context files found. Run `ham init --scan` first.");
    process.exit(1);
  }

  const config = readLocalConfig(rootDir);
  if (budget !== undefined) config.defaultBudget = budget;

  const result = compile(files, targetPath, target, config);

  // Print bundle
  console.log(result.bundle);

  // Print report summary
  console.log("\n--- Compile Report ---");
  console.log(`Target:    ${result.report.target}`);
  console.log(`Path:      ${result.report.targetPath || "/"}`);
  console.log(`Entries:   ${result.report.includedEntries}`);
  console.log(`Tokens:    ${result.report.tokenCount}`);
  console.log(`Budget:    ${result.report.budgetUsed}%`);
  console.log(`Conflicts: ${result.report.conflicts.length}`);
  console.log(`Sources:   ${result.report.sources.map((s) => `${s.source}(${s.entries})`).join(", ")}`);
  console.log(`Cache Key: ${result.cacheKey}`);

  // Save last report
  const compiledDir = path.join(rootDir, ".ham", "compiled");
  if (!fs.existsSync(compiledDir)) {
    fs.mkdirSync(compiledDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(compiledDir, "last-report.json"),
    JSON.stringify(result.report, null, 2) + "\n",
    "utf-8"
  );
}

/** `ham report --last` — Read last cached report */
export function cmdReport(rootDir: string) {
  const reportPath = path.join(rootDir, ".ham", "compiled", "last-report.json");

  if (!fs.existsSync(reportPath)) {
    console.error("No cached report found. Run `ham compile` first.");
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(reportPath, "utf-8"));
  console.log(JSON.stringify(report, null, 2));
}

/** `ham export --target <tool>` — Write bundle to .ham/compiled/<target>.bundle */
export function cmdExport(
  rootDir: string,
  flags: { target?: string }
) {
  const target = (flags.target ?? "universal") as Target;

  if (!VALID_TARGETS.includes(target)) {
    console.error(`Invalid target "${target}". Must be one of: ${VALID_TARGETS.join(", ")}`);
    process.exit(1);
  }

  const files = discoverLocalFiles(rootDir);
  const config = readLocalConfig(rootDir);
  const result = compile(files, "", target, config);

  const compiledDir = path.join(rootDir, ".ham", "compiled");
  if (!fs.existsSync(compiledDir)) {
    fs.mkdirSync(compiledDir, { recursive: true });
  }

  const outPath = path.join(compiledDir, `${target}.bundle`);
  fs.writeFileSync(outPath, result.bundle, "utf-8");
  console.log(`Bundle written to ${path.relative(rootDir, outPath)}`);
  console.log(`Tokens: ${result.report.tokenCount} (${result.report.budgetUsed}% of budget)`);
}

/** `ham eject` / `ham eject --full` — Strip markers, optionally remove .ham/ */
export function cmdEject(
  rootDir: string,
  flags: { full?: boolean }
) {
  const result = eject(rootDir, {
    full: !!flags.full,
    markerPolicy: "keep_content",
  });

  console.log(result.summary);

  if (result.removedMarkers.length > 0) {
    for (const m of result.removedMarkers) {
      console.log(`  ${m.file}: ${m.linesRemoved} lines removed`);
    }
  }
}

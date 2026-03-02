#!/usr/bin/env node

import { cmdInit, cmdCompile, cmdReport, cmdExport, cmdEject } from "./commands";

function parseFlags(args: string[]): Record<string, string | boolean> {
  const flags: Record<string, string | boolean> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith("--")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    }
  }

  return flags;
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const flags = parseFlags(args.slice(1));
  const rootDir = process.cwd();

  switch (command) {
    case "init":
      cmdInit(rootDir, { scan: !!flags.scan });
      break;

    case "compile":
      cmdCompile(rootDir, {
        path: flags.path as string | undefined,
        target: flags.target as string | undefined,
        budget: flags.budget as string | undefined,
      });
      break;

    case "report":
      cmdReport(rootDir);
      break;

    case "export":
      cmdExport(rootDir, {
        target: flags.target as string | undefined,
      });
      break;

    case "eject":
      cmdEject(rootDir, { full: !!flags.full });
      break;

    case "help":
    case undefined:
      printHelp();
      break;

    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

function printHelp() {
  console.log(`
HAM — Hierarchical Agent Memory

Usage: ham <command> [options]

Commands:
  init [--scan]                         Discover context files and create .ham/config.json
  compile --path <file> --target <tool> --budget <n>
                                        Compile context bundle for a target tool
  report                                Show last compile report
  export --target <tool>                Write compiled bundle to .ham/compiled/
  eject [--full]                        Remove HAM markers (--full removes .ham/ too)
  help                                  Show this help message

Targets: claude, cursor, gemini, aider, copilot, llama, manus, universal
`);
}

main();

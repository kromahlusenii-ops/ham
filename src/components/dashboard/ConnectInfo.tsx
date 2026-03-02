"use client";

import { useState } from "react";
import { Info, ChevronDown, ChevronUp, Scan, FileText, Shield } from "lucide-react";

const DETECTED_FILES = [
  { tool: "HAM", pattern: ".ham/**/*.md" },
  { tool: "Claude", pattern: "CLAUDE.md" },
  { tool: "Cursor", pattern: ".cursorrules" },
  { tool: "Copilot", pattern: ".github/copilot-instructions.md" },
  { tool: "Gemini", pattern: "GEMINI.md, .gemini/" },
  { tool: "Agents", pattern: "AGENTS.md" },
  { tool: "Windsurf", pattern: ".windsurfrules" },
  { tool: "Llama", pattern: "LLAMA.md, .llama/" },
  { tool: "Manus", pattern: "MANUS.md, .manus/" },
];

export default function ConnectInfo() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-accent/20 bg-accent/5 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium text-ink">
            What happens when you connect a repo
          </span>
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 text-gray" />
          : <ChevronDown className="h-4 w-4 text-gray" />
        }
      </button>

      {open && (
        <div className="border-t border-accent/10 px-4 py-4 space-y-5">
          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-md bg-white/60 border border-accent/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent">
                  <Scan className="h-3 w-3 text-white" />
                </div>
                <span className="text-sm font-medium text-ink">
                  Auto-scan
                </span>
              </div>
              <p className="text-xs text-gray leading-relaxed">
                HAM scans your entire repo in a single API call and finds every
                AI tool config file. No setup, no configuration.
              </p>
            </div>

            <div className="rounded-md bg-white/60 border border-accent/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent">
                  <FileText className="h-3 w-3 text-white" />
                </div>
                <span className="text-sm font-medium text-ink">
                  Metadata only
                </span>
              </div>
              <p className="text-xs text-gray leading-relaxed">
                The initial scan detects file paths, sizes, and token counts.
                File contents are only loaded when you view a file or run a
                compile.
              </p>
            </div>

            <div className="rounded-md bg-white/60 border border-accent/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent">
                  <Shield className="h-3 w-3 text-white" />
                </div>
                <span className="text-sm font-medium text-ink">
                  Read-only
                </span>
              </div>
              <p className="text-xs text-gray leading-relaxed">
                HAM never modifies your files. Connecting a repo is read-only
                and can be disconnected at any time.
              </p>
            </div>
          </div>

          {/* Detected file patterns */}
          <div className="rounded-md bg-white/60 border border-accent/10 p-4">
            <p className="text-xs font-medium text-ink mb-3">
              Files HAM detects
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1.5">
              {DETECTED_FILES.map((f) => (
                <div key={f.tool} className="flex items-baseline gap-2 text-xs">
                  <span className="text-gray w-14 shrink-0">{f.tool}</span>
                  <code className="font-mono text-[11px] text-accent truncate">
                    {f.pattern}
                  </code>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

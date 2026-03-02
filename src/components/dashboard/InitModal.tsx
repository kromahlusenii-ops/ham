"use client";

import { useState, useEffect } from "react";
import {
  X,
  Loader2,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  ExternalLink,
} from "lucide-react";
import type { InitMode, InitResult } from "@/lib/types";

interface PreviewFile {
  path: string;
  content: string;
}

interface PreviewData {
  filesToCreate: PreviewFile[];
  existingFiles: string[];
}

type Step = "preview" | "execute" | "success";

export default function InitModal({
  repoId,
  open,
  onClose,
  onComplete,
}: {
  repoId: string;
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [step, setStep] = useState<Step>("preview");
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [result, setResult] = useState<InitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStep("preview");
      setPreview(null);
      setResult(null);
      setError(null);
      setExpandedFile(null);
      fetchPreview();
    }
  }, [open, repoId]);

  async function fetchPreview() {
    setLoading(true);
    try {
      const res = await fetch(`/api/repos/${repoId}/init/preview`);
      if (!res.ok) throw new Error("Failed to load preview");
      const data: PreviewData = await res.json();
      setPreview(data);
    } catch {
      setError("Failed to load init preview.");
    } finally {
      setLoading(false);
    }
  }

  async function executeInit(mode: InitMode) {
    setStep("execute");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/repos/${repoId}/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      if (!res.ok) throw new Error("Init failed");
      const data: InitResult = await res.json();
      setResult(data);
      setStep("success");
    } catch {
      setError("Initialization failed. Please try again.");
      setStep("preview");
    } finally {
      setLoading(false);
    }
  }

  function handleDone() {
    onComplete();
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative mx-4 w-full max-w-lg rounded-lg border border-stone bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone px-5 py-4">
          <h2 className="text-sm font-semibold text-ink">
            {step === "preview" && "Initialize HAM"}
            {step === "execute" && "Initializing..."}
            {step === "success" && "Initialization Complete"}
          </h2>
          <button
            onClick={onClose}
            className="text-ash hover:text-gray cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
          {/* Loading state */}
          {loading && step !== "execute" && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-gray" />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </div>
          )}

          {/* Step 1: Preview */}
          {step === "preview" && preview && (
            <div className="space-y-4">
              {preview.filesToCreate.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-gray uppercase tracking-wider">
                    Files to Create
                  </h3>
                  <div className="mt-2 space-y-1">
                    {preview.filesToCreate.map((file) => (
                      <div
                        key={file.path}
                        className="rounded border border-stone"
                      >
                        <button
                          onClick={() =>
                            setExpandedFile(
                              expandedFile === file.path ? null : file.path,
                            )
                          }
                          className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm hover:bg-silk"
                        >
                          {expandedFile === file.path ? (
                            <ChevronDown className="h-3 w-3 shrink-0 text-ash" />
                          ) : (
                            <ChevronRight className="h-3 w-3 shrink-0 text-ash" />
                          )}
                          <FileText className="h-3.5 w-3.5 shrink-0 text-accent" />
                          <span className="font-mono text-xs text-ink">
                            {file.path}
                          </span>
                        </button>
                        {expandedFile === file.path && (
                          <div className="border-t border-stone bg-silk/50 px-3 py-2">
                            <pre className="max-h-48 overflow-auto whitespace-pre-wrap text-[11px] text-gray font-mono leading-relaxed">
                              {file.content}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {preview.existingFiles.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-gray uppercase tracking-wider">
                    Already Exists (skipped)
                  </h3>
                  <div className="mt-2 space-y-1">
                    {preview.existingFiles.map((path) => (
                      <div
                        key={path}
                        className="flex items-center gap-2 rounded border border-stone bg-silk/30 px-3 py-2"
                      >
                        <Check className="h-3.5 w-3.5 text-accent" />
                        <span className="font-mono text-xs text-ash">
                          {path}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Executing */}
          {step === "execute" && (
            <div className="flex flex-col items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <p className="mt-3 text-sm text-gray">
                Creating memory files...
              </p>
            </div>
          )}

          {/* Step 3: Success */}
          {step === "success" && result && (
            <div className="space-y-4">
              <div className="flex flex-col items-center py-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                  <Check className="h-6 w-6 text-accent" />
                </div>
                <p className="mt-3 text-sm font-medium text-ink">
                  {result.filesCreated.length} file
                  {result.filesCreated.length !== 1 ? "s" : ""} created
                </p>
              </div>

              <div className="space-y-1">
                {result.filesCreated.map((path) => (
                  <div
                    key={path}
                    className="flex items-center gap-2 rounded border border-stone px-3 py-2"
                  >
                    <Check className="h-3.5 w-3.5 text-accent" />
                    <span className="font-mono text-xs text-ink">{path}</span>
                  </div>
                ))}
              </div>

              {result.prUrl && (
                <a
                  href={result.prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-md border border-accent bg-accent/5 px-4 py-2.5 text-sm font-medium text-accent hover:bg-accent/10"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Pull Request
                </a>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-stone px-5 py-3">
          {step === "preview" && preview && preview.filesToCreate.length > 0 && (
            <>
              <button
                onClick={() => executeInit("direct")}
                className="cursor-pointer rounded-md border border-stone px-3 py-1.5 text-xs font-medium text-ink hover:bg-silk"
              >
                Quick Init
              </button>
              <button
                onClick={() => executeInit("pr")}
                className="cursor-pointer rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent/90"
              >
                Open PR (Recommended)
              </button>
            </>
          )}

          {step === "success" && (
            <button
              onClick={handleDone}
              className="cursor-pointer rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent/90"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

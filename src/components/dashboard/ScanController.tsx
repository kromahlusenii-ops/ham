"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import type { MemoryFile, ScanStatus } from "@/lib/types";

export default function ScanController({
  repoId,
  onScanComplete,
}: {
  repoId: string;
  onScanComplete: (files: MemoryFile[]) => void;
}) {
  const [status, setStatus] = useState<ScanStatus>("idle");

  async function handleScan() {
    setStatus("scanning");
    try {
      const res = await fetch(`/api/repos/${repoId}/scan`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onScanComplete(data.files);
      setStatus("complete");
    } catch {
      setStatus("error");
    }
  }

  return (
    <button
      onClick={handleScan}
      disabled={status === "scanning"}
      className="flex items-center gap-2 rounded-md border border-stone bg-white px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-silk disabled:opacity-50 cursor-pointer"
    >
      <RefreshCw
        className={`h-3.5 w-3.5 ${status === "scanning" ? "animate-spin" : ""}`}
      />
      {status === "scanning" ? "Scanning…" : "Re-scan"}
    </button>
  );
}

"use client";

import { useState } from "react";
import type { MemoryFile } from "@/lib/types";
import ScanSummaryCards from "./ScanSummaryCards";
import ScanController from "./ScanController";
import MemoryFileTree from "./MemoryFileTree";
import InitCTA from "./InitCTA";
import InitModal from "./InitModal";
import RepoAnalytics from "./RepoAnalytics";
import ScopeView from "./ScopeView";
import CompileView from "./CompileView";

type Tab = "analytics" | "files" | "scope" | "compile";

export default function RepoDetail({
  repoId,
  repoName,
  hamInitialized,
  initialFiles,
}: {
  repoId: string;
  repoName: string;
  hamInitialized: boolean;
  initialFiles: MemoryFile[];
}) {
  const [files, setFiles] = useState<MemoryFile[]>(initialFiles);
  const [initialized, setInitialized] = useState(hamInitialized);
  const [initModalOpen, setInitModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("analytics");

  async function handleInitComplete() {
    setInitialized(true);
    try {
      const res = await fetch(`/api/repos/${repoId}/scan`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files);
      }
    } catch {
      // Silently ignore re-scan failure
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "analytics", label: "Analytics" },
    { key: "files", label: "Files" },
    { key: "scope", label: "Scope" },
    { key: "compile", label: "Compile" },
  ];

  return (
    <div className="space-y-6">
      {/* Tab navigation */}
      <div className="flex items-center gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === tab.key
                ? "bg-silk text-ink"
                : "text-gray hover:text-ink hover:bg-silk/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "analytics" && <RepoAnalytics repoId={repoId} />}

      {activeTab === "scope" && <ScopeView files={files} />}

      {activeTab === "compile" && <CompileView repoId={repoId} files={files} />}

      {activeTab === "files" && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray">Scan Results</h2>
            <ScanController repoId={repoId} onScanComplete={setFiles} />
          </div>

          {!initialized && (
            <InitCTA
              files={files}
              onInitClick={() => setInitModalOpen(true)}
            />
          )}

          <ScanSummaryCards files={files} />
          <MemoryFileTree files={files} repoId={repoId} />

          <InitModal
            repoId={repoId}
            open={initModalOpen}
            onClose={() => setInitModalOpen(false)}
            onComplete={handleInitComplete}
          />
        </>
      )}
    </div>
  );
}

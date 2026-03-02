"use client";

import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  FolderOpen,
  Loader2,
  X,
} from "lucide-react";
import type { MemoryFile } from "@/lib/types";
import { MEMORY_FILE_TYPE_CONFIG } from "@/lib/constants";

interface TreeNode {
  name: string;
  path: string;
  children: Map<string, TreeNode>;
  file: MemoryFile | null;
}

function buildTree(files: MemoryFile[]): TreeNode {
  const root: TreeNode = { name: "", path: "", children: new Map(), file: null };

  for (const file of files) {
    const parts = file.path.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;

      if (!current.children.has(part)) {
        current.children.set(part, {
          name: part,
          path: parts.slice(0, i + 1).join("/"),
          children: new Map(),
          file: isFile ? file : null,
        });
      } else if (isFile) {
        current.children.get(part)!.file = file;
      }

      current = current.children.get(part)!;
    }
  }

  return root;
}

function TreeItem({
  node,
  depth,
  onFileClick,
}: {
  node: TreeNode;
  depth: number;
  onFileClick: (file: MemoryFile) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const isDir = node.children.size > 0 && !node.file;
  const sortedChildren = Array.from(node.children.values()).sort((a, b) => {
    // Directories first, then files
    const aIsDir = a.children.size > 0 && !a.file;
    const bIsDir = b.children.size > 0 && !b.file;
    if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  if (isDir) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-sm text-ink hover:bg-silk cursor-pointer"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-ash" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ash" />
          )}
          {expanded ? (
            <FolderOpen className="h-3.5 w-3.5 shrink-0 text-accent" />
          ) : (
            <Folder className="h-3.5 w-3.5 shrink-0 text-accent" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {expanded && (
          <div>
            {sortedChildren.map((child) => (
              <TreeItem
                key={child.path}
                node={child}
                depth={depth + 1}
                onFileClick={onFileClick}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // File node
  if (!node.file) return null;
  const config = MEMORY_FILE_TYPE_CONFIG[node.file.file_type];

  return (
    <button
      onClick={() => onFileClick(node.file!)}
      className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-sm text-ink hover:bg-silk cursor-pointer"
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
    >
      <span className="h-3.5 w-3.5 shrink-0" />
      <FileText className="h-3.5 w-3.5 shrink-0 text-gray" />
      <span className="truncate">{node.name}</span>
      <span
        className={`ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${config.color}`}
      >
        {config.label}
      </span>
      <span className="shrink-0 text-xs text-ash">
        {node.file.token_count} tok
      </span>
    </button>
  );
}

export default function MemoryFileTree({
  files,
  repoId,
}: {
  files: MemoryFile[];
  repoId: string;
}) {
  const [selectedFile, setSelectedFile] = useState<MemoryFile | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);

  const tree = buildTree(files);

  async function handleFileClick(file: MemoryFile) {
    setSelectedFile(file);

    // If content already loaded in the file object, use it
    if (file.content) {
      setContent(file.content);
      return;
    }

    setLoadingContent(true);
    setContent(null);

    try {
      const res = await fetch(
        `/api/repos/${repoId}/files/${file.id}/content`,
        { method: "POST" },
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setContent(data.content);
    } catch {
      setContent("Failed to load file content.");
    } finally {
      setLoadingContent(false);
    }
  }

  if (files.length === 0) {
    return (
      <div className="rounded-lg border border-stone bg-white p-8 text-center">
        <FileText className="mx-auto h-8 w-8 text-ash" />
        <p className="mt-2 text-sm text-gray">
          No memory files found.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* File tree */}
      <div className="rounded-lg border border-stone bg-white">
        <div className="border-b border-stone px-4 py-2.5">
          <h3 className="text-xs font-medium text-gray uppercase tracking-wider">
            File Tree
          </h3>
        </div>
        <div className="p-2">
          {Array.from(tree.children.values())
            .sort((a, b) => {
              const aIsDir = a.children.size > 0 && !a.file;
              const bIsDir = b.children.size > 0 && !b.file;
              if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
              return a.name.localeCompare(b.name);
            })
            .map((child) => (
              <TreeItem
                key={child.path}
                node={child}
                depth={0}
                onFileClick={handleFileClick}
              />
            ))}
        </div>
      </div>

      {/* Content preview */}
      <div className="rounded-lg border border-stone bg-white">
        <div className="flex items-center justify-between border-b border-stone px-4 py-2.5">
          <h3 className="text-xs font-medium text-gray uppercase tracking-wider">
            {selectedFile ? selectedFile.path : "Preview"}
          </h3>
          {selectedFile && (
            <button
              onClick={() => {
                setSelectedFile(null);
                setContent(null);
              }}
              className="text-ash hover:text-gray cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="p-4">
          {!selectedFile && (
            <p className="text-sm text-ash">
              Click a file to preview its contents.
            </p>
          )}
          {selectedFile && loadingContent && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray" />
            </div>
          )}
          {selectedFile && !loadingContent && content && (
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap text-xs text-ink font-mono leading-relaxed">
              {content}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

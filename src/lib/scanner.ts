import type { MemoryFileType } from "./types";

export const MEMORY_FILE_PATTERNS: Record<MemoryFileType, RegExp> = {
  ham: /^\.ham\/(?!config\.json$|compiled\/).*\.md$/,
  claude: /CLAUDE\.md$/,
  cursor: /\.cursorrules$/,
  copilot: /\.github\/copilot-instructions\.md$/,
  agents: /AGENTS\.md$/,
  windsurf: /\.windsurfrules$/,
  gemini: /(^|\/)GEMINI\.md$|(^|\/)\.gemini\/.+$/,
  llama: /(^|\/)LLAMA\.md$|(^|\/)\.llama\/.+$/,
  manus: /(^|\/)MANUS\.md$|(^|\/)\.manus\/.+$/,
};

export function detectFileType(path: string): MemoryFileType | null {
  for (const [type, pattern] of Object.entries(MEMORY_FILE_PATTERNS)) {
    if (pattern.test(path)) return type as MemoryFileType;
  }
  return null;
}

interface TreeEntry {
  path: string;
  mode: string;
  type: string;
  sha: string;
  size?: number;
}

export interface ScannedFile {
  path: string;
  file_type: MemoryFileType;
  sha: string;
  size_bytes: number;
  token_count: number;
}

/**
 * Single Trees API call to detect all memory files in a repo.
 * Returns metadata only — no content fetched.
 */
export async function scanRepo(
  token: string,
  owner: string,
  repo: string,
  branch: string,
): Promise<ScannedFile[]> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    },
  );

  if (!res.ok) {
    throw new Error(`GitHub Trees API error: ${res.status}`);
  }

  const data = (await res.json()) as { tree: TreeEntry[] };

  const files: ScannedFile[] = [];
  for (const entry of data.tree) {
    if (entry.type !== "blob") continue;
    const fileType = detectFileType(entry.path);
    if (!fileType) continue;

    const sizeBytes = entry.size ?? 0;
    files.push({
      path: entry.path,
      file_type: fileType,
      sha: entry.sha,
      size_bytes: sizeBytes,
      token_count: Math.ceil(sizeBytes / 4),
    });
  }

  return files;
}

/**
 * Fetch a single file's content from GitHub Contents API.
 * Returns decoded text content.
 */
export async function fetchFileContent(
  token: string,
  owner: string,
  repo: string,
  path: string,
): Promise<string> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    },
  );

  if (!res.ok) {
    throw new Error(`GitHub Contents API error: ${res.status}`);
  }

  const data = (await res.json()) as { content: string; encoding: string };

  if (data.encoding === "base64") {
    return Buffer.from(data.content, "base64").toString("utf-8");
  }

  return data.content;
}

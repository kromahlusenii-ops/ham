export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  private: boolean;
  default_branch: string;
  description: string | null;
}

export interface ConnectedRepo {
  id: string;
  user_id: string;
  github_id: number;
  name: string;
  full_name: string;
  owner: string;
  private: boolean;
  default_branch: string;
  description: string | null;
  connected_at: string;
  ham_initialized: boolean;
}

export interface RepoStats {
  memoryFileCount: number;
  tokenCount: number;
  fileTypes: string[];
  lastScannedAt: string | null;
  hamInitialized: boolean;
}

export interface OverviewStats {
  totalRepos: number;
  totalMemoryFiles: number;
  totalTokens: number;
  fileTypesBreakdown: Record<string, number>;
}

export type MemoryFileType = "ham" | "claude" | "cursor" | "copilot" | "agents" | "windsurf" | "gemini" | "llama" | "manus";

export interface MemoryFile {
  id: string;
  repo_id: string;
  path: string;
  file_type: MemoryFileType;
  sha: string;
  size_bytes: number;
  token_count: number;
  content: string | null;
  last_scanned_at: string;
}

export type ScanStatus = "idle" | "scanning" | "complete" | "error";

export type InitMode = "direct" | "pr";

export interface InitResult {
  mode: InitMode;
  filesCreated: string[];
  prUrl?: string;
}

// ── Scope Analysis Types ─────────────────────────────────────────────

export interface DirectoryAgentEntry {
  fileCount: number;
  tokenCount: number;
  files: string[];
}

export interface DirectoryScope {
  path: string;
  depth: number;
  agents: Partial<Record<MemoryFileType, DirectoryAgentEntry>>;
  totalTokens: number;
  totalFiles: number;
}

export interface ScopeChainLink {
  path: string;
  depth: number;
  agents: Partial<Record<MemoryFileType, DirectoryAgentEntry>>;
  totalTokens: number;
}

export interface ScopeChainResult {
  chain: ScopeChainLink[];
  agentTotals: Partial<Record<MemoryFileType, { tokenCount: number; fileCount: number }>>;
  totalTokens: number;
  totalFiles: number;
}

export interface CoverageMatrix {
  directories: DirectoryScope[];
  activeAgents: MemoryFileType[];
  allPaths: string[];
}

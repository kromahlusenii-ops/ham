import type {
  MemoryFile,
  MemoryFileType,
  DirectoryScope,
  DirectoryAgentEntry,
  CoverageMatrix,
  ScopeChainResult,
  ScopeChainLink,
} from "./types";

/** Extract the directory portion of a file path. Root-level files return "". */
export function getDirectoryPath(filePath: string): string {
  const lastSlash = filePath.lastIndexOf("/");
  return lastSlash === -1 ? "" : filePath.slice(0, lastSlash);
}

/** Return all ancestor paths from root ("") to the given directory, inclusive. */
export function getAncestorPaths(dirPath: string): string[] {
  if (!dirPath) return [""];
  const parts = dirPath.split("/");
  const paths: string[] = [""];
  for (let i = 0; i < parts.length; i++) {
    paths.push(parts.slice(0, i + 1).join("/"));
  }
  return paths;
}

/** Group files by directory and compute per-agent token/file counts. */
export function buildDirectoryScopes(files: MemoryFile[]): DirectoryScope[] {
  const map = new Map<string, DirectoryScope>();

  for (const file of files) {
    const dir = getDirectoryPath(file.path);
    let scope = map.get(dir);
    if (!scope) {
      scope = {
        path: dir,
        depth: dir === "" ? 0 : dir.split("/").length,
        agents: {},
        totalTokens: 0,
        totalFiles: 0,
      };
      map.set(dir, scope);
    }

    const agentType = file.file_type;
    let entry = scope.agents[agentType];
    if (!entry) {
      entry = { fileCount: 0, tokenCount: 0, files: [] };
      scope.agents[agentType] = entry;
    }

    entry.fileCount++;
    entry.tokenCount += file.token_count;
    entry.files.push(file.path);

    scope.totalTokens += file.token_count;
    scope.totalFiles++;
  }

  return Array.from(map.values()).sort((a, b) => a.path.localeCompare(b.path));
}

/** Build a coverage matrix: directory scopes + deduplicated active agent list. */
export function buildCoverageMatrix(files: MemoryFile[]): CoverageMatrix {
  const directories = buildDirectoryScopes(files);

  // Stable agent order: match the order agents first appear across directories
  const agentSet = new Set<MemoryFileType>();
  for (const dir of directories) {
    for (const agent of Object.keys(dir.agents) as MemoryFileType[]) {
      agentSet.add(agent);
    }
  }

  return {
    directories,
    activeAgents: Array.from(agentSet),
    allPaths: directories.map((d) => d.path),
  };
}

/** Simulate "working in targetPath": collect files from all ancestor directories. */
export function computeScopeChain(
  files: MemoryFile[],
  targetPath: string
): ScopeChainResult {
  const ancestors = new Set(getAncestorPaths(targetPath));

  // Filter to only files in ancestor directories
  const relevantFiles = files.filter((f) =>
    ancestors.has(getDirectoryPath(f.path))
  );

  const scopeMap = new Map<string, ScopeChainLink>();
  const agentTotals: ScopeChainResult["agentTotals"] = {};
  let totalTokens = 0;
  let totalFiles = 0;

  for (const file of relevantFiles) {
    const dir = getDirectoryPath(file.path);
    let link = scopeMap.get(dir);
    if (!link) {
      link = {
        path: dir,
        depth: dir === "" ? 0 : dir.split("/").length,
        agents: {},
        totalTokens: 0,
      };
      scopeMap.set(dir, link);
    }

    const agentType = file.file_type;
    let entry = link.agents[agentType];
    if (!entry) {
      entry = { fileCount: 0, tokenCount: 0, files: [] };
      link.agents[agentType] = entry;
    }
    entry.fileCount++;
    entry.tokenCount += file.token_count;
    entry.files.push(file.path);
    link.totalTokens += file.token_count;

    // Accumulate agent totals
    if (!agentTotals[agentType]) {
      agentTotals[agentType] = { tokenCount: 0, fileCount: 0 };
    }
    agentTotals[agentType]!.tokenCount += file.token_count;
    agentTotals[agentType]!.fileCount++;

    totalTokens += file.token_count;
    totalFiles++;
  }

  // Build chain sorted by depth (root first)
  const chain = Array.from(scopeMap.values()).sort(
    (a, b) => a.depth - b.depth
  );

  return { chain, agentTotals, totalTokens, totalFiles };
}

import type { ContextFile } from "./types";

/**
 * R1 — Scoped Discovery.
 * Given a target path and a flat list of ContextFiles,
 * filter to only files in the target's directory ancestry.
 */
export function discoverForPath(
  files: ContextFile[],
  targetPath: string
): ContextFile[] {
  const ancestors = getAncestorPaths(getDirectoryPath(targetPath));
  const ancestorSet = new Set(ancestors);

  return files.filter((file) => {
    const fileDir = getDirectoryPath(file.path);
    return ancestorSet.has(fileDir);
  });
}

/** Extract the directory portion of a file path. Root-level files return "". */
function getDirectoryPath(filePath: string): string {
  const lastSlash = filePath.lastIndexOf("/");
  return lastSlash === -1 ? "" : filePath.slice(0, lastSlash);
}

/** Return all ancestor paths from root ("") to the given directory, inclusive. */
function getAncestorPaths(dirPath: string): string[] {
  if (!dirPath) return [""];
  const parts = dirPath.split("/");
  const paths: string[] = [""];
  for (let i = 0; i < parts.length; i++) {
    paths.push(parts.slice(0, i + 1).join("/"));
  }
  return paths;
}

import { NextResponse } from "next/server";
import { getUser, isSupabaseConfigured } from "@/lib/auth";
import { MOCK_MEMORY_FILES } from "@/lib/mock-scan-data";
import { compile } from "@/lib/compiler/compile";
import type { ContextFile, Target, Source } from "@/lib/compiler/types";
import type { MemoryFile, MemoryFileType } from "@/lib/types";

/** Map MemoryFileType to compiler Source. */
function toSource(fileType: MemoryFileType): Source | null {
  const map: Partial<Record<MemoryFileType, Source>> = {
    ham: "ham",
    claude: "claude",
    cursor: "cursor",
    copilot: "copilot",
    gemini: "gemini",
  };
  return map[fileType] ?? null;
}

/** Convert MemoryFiles to ContextFiles for the compiler. */
function toContextFiles(files: MemoryFile[]): ContextFile[] {
  const result: ContextFile[] = [];
  for (const file of files) {
    const source = toSource(file.file_type);
    if (!source || !file.content) continue;
    result.push({
      path: file.path,
      content: file.content,
      source,
    });
  }
  return result;
}

const VALID_TARGETS: Target[] = ["cursor", "claude", "gemini", "aider", "copilot", "llama", "manus", "universal"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: repoId } = await params;

  let body: { targetPath?: string; target?: string; budget?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const targetPath = body.targetPath ?? "";
  const target = (body.target ?? "universal") as Target;
  const budget = body.budget ?? 2000;

  if (!VALID_TARGETS.includes(target)) {
    return NextResponse.json(
      { error: `Invalid target. Must be one of: ${VALID_TARGETS.join(", ")}` },
      { status: 400 }
    );
  }

  if (budget < 100 || budget > 50000) {
    return NextResponse.json(
      { error: "Budget must be between 100 and 50000" },
      { status: 400 }
    );
  }

  // Dev mode: use mock data
  if (!isSupabaseConfigured()) {
    const mockFiles = MOCK_MEMORY_FILES[repoId] ?? [];
    const contextFiles = toContextFiles(mockFiles);
    const result = compile(contextFiles, targetPath, target, { defaultBudget: budget });
    return NextResponse.json(result);
  }

  // Production: load files from DB
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data: files } = await supabase
    .from("memory_files")
    .select("*")
    .eq("repo_id", repoId);

  if (!files || files.length === 0) {
    return NextResponse.json(
      { error: "No memory files found for this repo. Run a scan first." },
      { status: 404 }
    );
  }

  const contextFiles = toContextFiles(files as MemoryFile[]);
  const result = compile(contextFiles, targetPath, target, { defaultBudget: budget });

  return NextResponse.json(result);
}

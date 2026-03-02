import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getUser, isSupabaseConfigured, getGhToken } from "@/lib/auth";
import { getInitFiles } from "@/lib/ham-templates";
import {
  getBranchSha,
  createBranch,
  createOrUpdateFile,
  createPullRequest,
  getFileSha,
} from "@/lib/github-write";
import type { ConnectedRepo, InitMode, InitResult } from "@/lib/types";

const INIT_PATHS = [
  "CLAUDE.md",
  ".ham/config.json",
  ".memory/decisions.md",
  ".memory/patterns.md",
  ".memory/inbox.md",
];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const mode: InitMode = body.mode ?? "pr";

  // Dev mode — return mock result
  if (!isSupabaseConfigured()) {
    const result: InitResult = {
      mode,
      filesCreated: [
        "CLAUDE.md",
        ".ham/config.json",
        ".memory/decisions.md",
        ".memory/patterns.md",
        ".memory/inbox.md",
      ],
      prUrl:
        mode === "pr"
          ? "https://github.com/ham-dev/design-system/pull/1"
          : undefined,
    };
    return NextResponse.json(result);
  }

  // Prod mode
  const token = await getGhToken();
  if (!token) {
    return NextResponse.json({ error: "no_github_token" }, { status: 401 });
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data: repo } = await supabase
    .from("connected_repos")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!repo) {
    return NextResponse.json({ error: "Repo not found" }, { status: 404 });
  }

  const typedRepo = repo as ConnectedRepo;

  try {
    // Check which files already exist (parallel)
    const shaResults = await Promise.all(
      INIT_PATHS.map((path) =>
        getFileSha(token, typedRepo.owner, typedRepo.name, path, typedRepo.default_branch),
      ),
    );
    const existingFiles = INIT_PATHS.filter((_, i) => shaResults[i]);

    const files = getInitFiles(
      { name: typedRepo.name, description: typedRepo.description },
      existingFiles,
    );

    const filePaths = Object.keys(files);
    if (filePaths.length === 0) {
      return NextResponse.json({
        mode,
        filesCreated: [],
        message: "All HAM files already exist",
      });
    }

    const targetBranch =
      mode === "pr" ? "ham/init" : typedRepo.default_branch;

    // For PR mode, create a new branch
    if (mode === "pr") {
      const baseSha = await getBranchSha(
        token,
        typedRepo.owner,
        typedRepo.name,
        typedRepo.default_branch,
      );
      await createBranch(
        token,
        typedRepo.owner,
        typedRepo.name,
        targetBranch,
        baseSha,
      );
    }

    // Create files (parallel)
    await Promise.all(
      Object.entries(files).map(([path, content]) =>
        createOrUpdateFile(
          token,
          typedRepo.owner,
          typedRepo.name,
          path,
          content,
          `chore: add ${path} via HAM`,
          targetBranch,
        ),
      ),
    );

    let prUrl: string | undefined;
    if (mode === "pr") {
      prUrl = await createPullRequest(
        token,
        typedRepo.owner,
        typedRepo.name,
        "Initialize HAM memory files",
        [
          "## HAM Initialization",
          "",
          "This PR adds the foundational memory files for [HAM](https://ham.dev):",
          "",
          ...filePaths.map((p) => `- \`${p}\``),
          "",
          "These files help AI coding agents understand your project structure and conventions.",
        ].join("\n"),
        targetBranch,
        typedRepo.default_branch,
      );
    }

    // Mark repo as initialized
    await supabase
      .from("connected_repos")
      .update({ ham_initialized: true })
      .eq("id", id);

    revalidateTag("repo-analytics", { expire: 0 });
    revalidateTag("connected-repos", { expire: 0 });

    // Trigger a re-scan by calling the scan endpoint internally
    const scanRes = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/repos/${id}/scan`,
      {
        method: "POST",
        headers: { Cookie: request.headers.get("Cookie") ?? "" },
      },
    );

    const result: InitResult = {
      mode,
      filesCreated: filePaths,
      prUrl,
    };

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Init failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import type { ConnectedRepo } from "./types";

/**
 * Mock connected repos for dev mode (no Supabase).
 */
export const MOCK_CONNECTED_REPOS: ConnectedRepo[] = [
  {
    id: "mock-1",
    user_id: "dev-local-user-001",
    github_id: 100001,
    name: "ham",
    full_name: "ham-dev/ham",
    owner: "ham-dev",
    private: false,
    default_branch: "main",
    description: "Hierarchical Agent Memory for AI coding agents",
    connected_at: "2026-02-15T10:00:00Z",
    ham_initialized: true,
  },
  {
    id: "mock-2",
    user_id: "dev-local-user-001",
    github_id: 100002,
    name: "acme-api",
    full_name: "ham-dev/acme-api",
    owner: "ham-dev",
    private: true,
    default_branch: "main",
    description: "Internal REST API for Acme Corp",
    connected_at: "2026-02-18T14:30:00Z",
    ham_initialized: true,
  },
  {
    id: "mock-3",
    user_id: "dev-local-user-001",
    github_id: 100003,
    name: "design-system",
    full_name: "ham-dev/design-system",
    owner: "ham-dev",
    private: false,
    default_branch: "main",
    description: "Shared React component library",
    connected_at: "2026-02-20T09:15:00Z",
    ham_initialized: false,
  },
];

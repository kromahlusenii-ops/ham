import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";

const DEV_AUTH_COOKIE = "dev-auth";

export const DEV_USER = {
  id: "dev-local-user-001",
  aud: "authenticated",
  role: "authenticated",
  email: "dev@ham.local",
  email_confirmed_at: "2026-01-01T00:00:00Z",
  phone: "",
  confirmed_at: "2026-01-01T00:00:00Z",
  last_sign_in_at: new Date().toISOString(),
  app_metadata: { provider: "github", providers: ["github"] },
  user_metadata: {
    user_name: "ham-dev",
    preferred_username: "ham-dev",
    avatar_url: "",
    full_name: "HAM Developer",
  },
  identities: [],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: new Date().toISOString(),
  factors: [],
} as unknown as User;

export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function getGhToken(): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    return "dev-mock-token";
  }

  // First check the persisted cookie
  const cookieStore = await cookies();
  const token = cookieStore.get("gh-token");
  if (token?.value) return token.value;

  // Fallback: try to get provider_token from the active Supabase session
  // (available if the session hasn't been refreshed yet)
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.provider_token ?? null;
}

export async function getUser(): Promise<User | null> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  }

  // Dev mode — cookie-based mock auth
  const cookieStore = await cookies();
  const devAuth = cookieStore.get(DEV_AUTH_COOKIE);
  return devAuth ? DEV_USER : null;
}

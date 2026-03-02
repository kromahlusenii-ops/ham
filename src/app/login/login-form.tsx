"use client";

import { useState } from "react";
import { Github, Loader2 } from "lucide-react";

const supabaseConfigured = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function LoginForm() {
  const [loading, setLoading] = useState(false);

  async function handleGitHubLogin() {
    setLoading(true);
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: "repo",
      },
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <p className="font-mono text-sm font-medium tracking-tight text-ink">
            HAM
          </p>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-ink">
            Sign in to HAM Pro
          </h1>
          <p className="mt-2 text-sm text-gray">
            {supabaseConfigured
              ? "Connect your GitHub account to get started."
              : "Dev mode — no external services required."}
          </p>
        </div>

        {supabaseConfigured && (
          <button
            onClick={handleGitHubLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-ink px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-charcoal disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Github className="h-4 w-4" />
            )}
            Continue with GitHub
          </button>
        )}

        {!supabaseConfigured && (
          <form action="/api/auth/dev-login" method="POST">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-md bg-ink px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-charcoal cursor-pointer"
            >
              Sign in as ham-dev
            </button>
          </form>
        )}

        <p className="text-center text-xs text-ash">
          By continuing, you agree to our{" "}
          <a href="#" className="text-gray hover:text-ink underline">
            Terms
          </a>{" "}
          and{" "}
          <a href="#" className="text-gray hover:text-ink underline">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}

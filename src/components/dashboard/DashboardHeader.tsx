"use client";

import { useState, useRef, useEffect } from "react";
import { LogOut, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import DashboardNav from "./DashboardNav";

const supabaseConfigured = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function DashboardHeader({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const username =
    (user.user_metadata?.user_name as string) ??
    (user.user_metadata?.preferred_username as string) ??
    "User";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    if (supabaseConfigured) {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } else {
      // Dev mode — POST to clear cookie, follows redirect to /
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "/api/auth/dev-logout";
      document.body.appendChild(form);
      form.submit();
    }
  }

  return (
    <header className="border-b border-stone bg-white">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 sm:px-8">
        <div className="flex items-center gap-6">
          <a
            href="/"
            className="font-mono text-sm font-medium tracking-tight text-ink"
          >
            HAM
          </a>
          <DashboardNav />
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-silk cursor-pointer"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={username}
                width={28}
                height={28}
                className="rounded-full"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-silk text-xs font-medium text-gray">
                {username[0]?.toUpperCase()}
              </div>
            )}
            <ChevronDown className="h-3.5 w-3.5 text-gray" />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-48 rounded-md border border-stone bg-white py-1 shadow-sm">
              <div className="border-b border-stone px-3 py-2">
                <p className="text-sm font-medium text-ink">{username}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray transition-colors hover:bg-silk hover:text-ink cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}

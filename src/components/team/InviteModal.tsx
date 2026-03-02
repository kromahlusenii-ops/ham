"use client";

import { useState } from "react";
import { X } from "lucide-react";

export default function InviteModal({ onClose }: { onClose: () => void }) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError("");

    const res = await fetch("/api/team/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ github_username: username.trim() }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to send invite");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="w-full max-w-sm rounded-lg border border-stone bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-ink">Invite team member</h2>
          <button
            onClick={onClose}
            className="text-gray hover:text-ink cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {success ? (
          <div className="mt-6">
            <p className="text-sm text-accent">
              Invite sent to @{username}
            </p>
            <button
              onClick={onClose}
              className="mt-4 w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-charcoal cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="gh-username" className="block text-xs font-medium text-gray">
                GitHub username
              </label>
              <input
                id="gh-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="octocat"
                className="mt-1.5 w-full rounded-lg border border-stone bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                required
                autoFocus
              />
            </div>

            {error && <p className="text-sm text-negative">{error}</p>}

            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-charcoal disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Sending..." : "Send Invite"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

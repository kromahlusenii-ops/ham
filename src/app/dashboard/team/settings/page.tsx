"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X } from "lucide-react";
import { mutate } from "swr";
import { useTeamSettings } from "@/lib/hooks/use-team-settings";

export default function TeamSettingsPage() {
  const router = useRouter();
  const { team, members, invites, isLoading, mutateSettings, mutateMembers } = useTeamSettings();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Sync name input when team data loads
  useEffect(() => {
    if (team?.name) setName(team.name);
  }, [team?.name]);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    await fetch("/api/team/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    mutateSettings();
    setSaving(false);
  }

  async function handleRemoveMember(memberId: string) {
    await fetch("/api/team/members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ member_id: memberId }),
    });
    mutateMembers();
    // Also refresh team stats since member count changed
    mutate((key) => typeof key === "string" && key.startsWith("/api/team/stats"));
  }

  async function handleDeleteTeam() {
    if (!confirm("Are you sure you want to delete this team? This action cannot be undone.")) return;
    setDeleting(true);
    await fetch("/api/team/settings", { method: "DELETE" });
    router.push("/dashboard");
    router.refresh();
  }

  if (isLoading || !team) {
    return (
      <div className="py-16 text-center text-sm text-gray">Loading...</div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        Team Settings
      </h1>

      {/* Team name */}
      <section className="mt-8">
        <h2 className="text-sm font-medium text-ink">Team name</h2>
        <div className="mt-3 flex gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 rounded-lg border border-stone bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-charcoal disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </section>

      {/* Members */}
      <section className="mt-10">
        <h2 className="text-sm font-medium text-ink">
          Members ({members.length})
        </h2>
        <div className="mt-3 divide-y divide-stone rounded-lg border border-stone bg-white">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                {m.github_avatar_url ? (
                  <img
                    src={m.github_avatar_url}
                    alt={m.github_username}
                    className="h-7 w-7 rounded-full"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-silk text-xs font-medium text-gray">
                    {(m.display_name ?? m.github_username)[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-ink">
                    {m.display_name ?? m.github_username}
                  </p>
                  <p className="text-xs text-gray">@{m.github_username}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray">{m.role}</span>
                {m.role !== "owner" && (
                  <button
                    onClick={() => handleRemoveMember(m.id)}
                    className="text-gray hover:text-negative cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pending invites */}
      {invites.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-medium text-ink">
            Pending Invites ({invites.length})
          </h2>
          <div className="mt-3 divide-y divide-stone rounded-lg border border-stone bg-white">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-4 py-3">
                <p className="text-sm text-ink">@{inv.github_username}</p>
                <span className="text-xs text-gray">Pending</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Danger zone */}
      <section className="mt-12 rounded-lg border border-negative/20 bg-negative-light p-6">
        <h2 className="text-sm font-medium text-negative">Danger zone</h2>
        <p className="mt-1 text-xs text-gray">
          Deleting your team will remove all members, sessions, and benchmarks permanently.
        </p>
        <button
          onClick={handleDeleteTeam}
          disabled={deleting}
          className="mt-4 flex items-center gap-2 rounded-lg bg-negative px-4 py-2 text-sm font-medium text-white hover:bg-negative/90 disabled:opacity-50 cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {deleting ? "Deleting..." : "Delete Team"}
        </button>
      </section>
    </div>
  );
}

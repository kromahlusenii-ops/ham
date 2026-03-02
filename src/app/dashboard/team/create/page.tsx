"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function CreateTeamPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleNameChange(value: string) {
    setName(value);
    if (!slugEdited) setSlug(toSlug(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    setLoading(true);
    setError("");

    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), slug: slug.trim() }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create team");
      setLoading(false);
      return;
    }

    router.push("/dashboard/team");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        Create your team
      </h1>
      <p className="mt-2 text-sm text-gray">
        Set up a team to track AI spend across your engineering org.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="name" className="block text-xs font-medium text-gray">
            Team name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Acme Engineering"
            className="mt-1.5 w-full rounded-lg border border-stone bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent"
            required
          />
        </div>

        <div>
          <label htmlFor="slug" className="block text-xs font-medium text-gray">
            Team slug
          </label>
          <input
            id="slug"
            type="text"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugEdited(true);
            }}
            placeholder="acme-eng"
            className="mt-1.5 w-full rounded-lg border border-stone bg-white px-3 py-2 font-mono text-sm text-ink outline-none transition-colors focus:border-accent"
            required
          />
        </div>

        {error && (
          <p className="text-sm text-negative">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !name.trim() || !slug.trim()}
          className="w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-charcoal disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Creating..." : "Create Team"}
        </button>
      </form>
    </div>
  );
}

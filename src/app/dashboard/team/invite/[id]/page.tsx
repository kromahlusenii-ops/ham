"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function InviteAcceptPage() {
  const router = useRouter();
  const params = useParams();
  const inviteId = params.id as string;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAction(action: "accept" | "decline") {
    setLoading(true);
    setError("");

    const res = await fetch(`/api/team/invite/${inviteId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      setLoading(false);
      return;
    }

    if (action === "accept") {
      router.push("/dashboard/team");
    } else {
      router.push("/dashboard");
    }
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        Team Invite
      </h1>
      <p className="mt-2 text-sm text-gray">
        You&apos;ve been invited to join a team on HAM.
      </p>

      {error && (
        <p className="mt-4 text-sm text-negative">{error}</p>
      )}

      <div className="mt-8 flex justify-center gap-3">
        <button
          onClick={() => handleAction("decline")}
          disabled={loading}
          className="rounded-lg border border-stone px-6 py-2.5 text-sm font-medium text-gray hover:bg-silk disabled:opacity-50 cursor-pointer"
        >
          Decline
        </button>
        <button
          onClick={() => handleAction("accept")}
          disabled={loading}
          className="rounded-lg bg-ink px-6 py-2.5 text-sm font-medium text-white hover:bg-charcoal disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Joining..." : "Accept Invite"}
        </button>
      </div>
    </div>
  );
}

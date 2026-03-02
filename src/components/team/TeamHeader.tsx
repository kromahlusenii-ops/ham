"use client";

import { UserPlus, Settings } from "lucide-react";
import Link from "next/link";
import type { Team, TimeRange } from "@/lib/team-types";
import TimeRangeSelector from "./TimeRangeSelector";

export default function TeamHeader({
  team,
  timeRange,
  onTimeRangeChange,
  isOwner,
  onInvite,
}: {
  team: Team;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  isOwner: boolean;
  onInvite: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        {team.name}
      </h1>

      <div className="flex items-center gap-4">
        <TimeRangeSelector value={timeRange} onChange={onTimeRangeChange} />

        {isOwner && (
          <div className="flex items-center gap-2">
            <button
              onClick={onInvite}
              className="flex items-center gap-1.5 rounded-lg border border-stone px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-silk cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Invite
            </button>
            <Link
              href="/dashboard/team/settings"
              className="flex items-center gap-1.5 rounded-lg border border-stone px-3 py-1.5 text-sm font-medium text-gray transition-colors hover:bg-silk hover:text-ink"
            >
              <Settings className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

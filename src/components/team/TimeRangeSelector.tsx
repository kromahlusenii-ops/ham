"use client";

import type { TimeRange } from "@/lib/team-types";

const OPTIONS: TimeRange[] = [7, 14, 30, 90];

export default function TimeRangeSelector({
  value,
  onChange,
}: {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
            value === opt
              ? "bg-silk text-ink"
              : "text-gray hover:text-ink hover:bg-silk/50"
          }`}
        >
          {opt}d
        </button>
      ))}
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { Info } from "lucide-react";

export default function InfoTip({
  text,
  open,
  onToggle,
}: {
  text: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <span className="relative inline-flex items-center">
      <button
        onClick={onToggle}
        className="flex h-4 w-4 items-center justify-center rounded-full text-gray hover:text-ink cursor-pointer"
        aria-label="More information"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span className="absolute left-6 top-0 z-10 w-64 rounded-lg border border-stone bg-white p-3 text-xs leading-relaxed text-gray shadow-sm">
          {text}
        </span>
      )}
    </span>
  );
}

/** Self-contained info tip — manages its own open/close state and closes on outside click */
export function Tip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <span ref={ref} className="relative inline-flex items-center">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-4 w-4 items-center justify-center rounded-full text-ash hover:text-ink cursor-pointer"
        aria-label="More information"
      >
        <Info className="h-3 w-3" />
      </button>
      {open && (
        <span className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-64 rounded-lg border border-stone bg-white p-3 text-xs leading-relaxed text-gray shadow-md">
          {text}
        </span>
      )}
    </span>
  );
}

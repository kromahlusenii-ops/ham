"use client";

import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Loader2 } from "lucide-react";

export default function EmailForm({ onDark = false }: { onDark?: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("sending");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <AnimatePresence mode="wait">
      {status === "success" ? (
        <motion.div
          key="success"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`flex items-center gap-3 ${onDark ? "text-white" : "text-ink"}`}
        >
          <Check className="h-4 w-4 text-accent" />
          <span className="text-sm">
            You&apos;re on the list. Check your inbox.
          </span>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          onSubmit={handleSubmit}
          exit={{ opacity: 0 }}
          className="flex w-full max-w-md flex-col gap-2"
        >
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              disabled={status === "sending"}
              className={`flex-1 rounded-md border px-4 py-2.5 text-sm outline-none transition-colors disabled:opacity-60 ${
                onDark
                  ? "border-carbon bg-charcoal text-white placeholder:text-gray focus:border-ash"
                  : "border-stone bg-white text-ink placeholder:text-ash focus:border-carbon"
              }`}
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-charcoal disabled:opacity-60"
            >
              {status === "sending" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  Join
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
          {status === "error" && (
            <p className="text-sm text-negative">
              Something went wrong. Please try again.
            </p>
          )}
        </motion.form>
      )}
    </AnimatePresence>
  );
}

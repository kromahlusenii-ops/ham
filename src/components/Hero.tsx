"use client";

import { motion } from "framer-motion";
import { ArrowRight, Github } from "lucide-react";
import { HERO_STATS } from "@/lib/constants";
import { fadeInUp, stagger } from "@/lib/animations";
import Button from "./ui/Button";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pt-32 pb-24 md:pt-40 md:pb-32">
      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        <motion.div initial="hidden" animate="visible" variants={stagger}>
          {/* Eyebrow */}
          <motion.p
            variants={fadeInUp}
            className="font-mono text-[11px] uppercase tracking-widest text-gray"
          >
            Hierarchical Agent Memory
          </motion.p>

          {/* Headline — large, tight, left-aligned */}
          <motion.h1
            variants={fadeInUp}
            className="mt-6 max-w-3xl text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.05] tracking-tight text-ink"
          >
            Fewer tokens.
            <br />
            Lower cost.
            <br />
            Greener AI.
          </motion.h1>

          {/* Subhead */}
          <motion.p
            variants={fadeInUp}
            className="mt-6 max-w-xl text-base leading-relaxed text-gray"
          >
            Scoped memory files so any AI coding agent loads only the context it
            needs. Cut token usage by 50%. Works with Claude Code, Cursor,
            Copilot, Windsurf, and more.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={fadeInUp} className="mt-8 flex flex-wrap gap-3">
            <Button variant="primary" size="lg" href="#waitlist">
              Join the Waitlist
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
            <Button variant="secondary" size="lg" href="https://github.com/kromahlusenii-ops/ham">
              <Github className="h-3.5 w-3.5" />
              Try Free Version
            </Button>
          </motion.div>

          {/* Stats — clean horizontal row */}
          <motion.div
            variants={fadeInUp}
            className="mt-16 flex flex-wrap gap-12 border-t border-stone pt-8"
          >
            {HERO_STATS.map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-bold tracking-tight text-ink">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-gray">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Video — contained, intentional, not a backdrop */}
      <motion.div
        className="mx-auto mt-16 max-w-5xl px-6 sm:px-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
      >
        <div className="overflow-hidden rounded-lg border border-stone">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="aspect-video w-full object-cover"
          >
            <source src="/hero-bg.mp4" type="video/mp4" />
            <source src="/hero-bg.mov" type="video/quicktime" />
          </video>
        </div>
      </motion.div>
    </section>
  );
}

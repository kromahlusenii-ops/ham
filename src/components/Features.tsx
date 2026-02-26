"use client";

import { motion } from "framer-motion";
import { Users, Activity, BarChart3 } from "lucide-react";
import { FEATURES } from "@/lib/constants";
import { fadeInUp, stagger } from "@/lib/animations";
import Badge from "./ui/Badge";
import FeatureItem from "./ui/FeatureItem";

export default function Features() {
  return (
    <section id="features" className="border-t border-stone bg-snow py-24 md:py-32">
      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
        >
          <motion.p variants={fadeInUp} className="font-mono text-[11px] uppercase tracking-widest text-gray">
            Features
          </motion.p>
          <motion.h2 variants={fadeInUp} className="mt-4 max-w-xl text-3xl font-bold tracking-tight text-ink">
            Everything you need. Nothing you don&apos;t.
          </motion.h2>
        </motion.div>

        {/* Observability — horizontal strip */}
        <motion.div
          className="mt-12 grid gap-px overflow-hidden rounded-lg border border-stone bg-stone sm:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
        >
          <motion.div variants={fadeInUp} className="bg-ink p-6">
            <Activity className="h-4 w-4 text-accent-muted" />
            <h4 className="mt-3 text-sm font-semibold text-white">Multi-agent observability</h4>
            <p className="mt-2 text-sm leading-relaxed text-ash">
              Track token consumption across Claude, Cursor, Copilot, and any other agent in one view.
            </p>
          </motion.div>
          <motion.div variants={fadeInUp} className="bg-ink p-6">
            <Users className="h-4 w-4 text-accent-muted" />
            <h4 className="mt-3 text-sm font-semibold text-white">Team member comparison</h4>
            <p className="mt-2 text-sm leading-relaxed text-ash">
              Compare usage per seat. Surface coaching opportunities and forecast costs.
            </p>
          </motion.div>
          <motion.div variants={fadeInUp} className="bg-ink p-6">
            <BarChart3 className="h-4 w-4 text-accent-muted" />
            <h4 className="mt-3 text-sm font-semibold text-white">Analytics dashboard</h4>
            <p className="mt-2 text-sm leading-relaxed text-ash">
              Daily trends, per-directory breakdowns, cost projections. Export to CSV.
            </p>
          </motion.div>
        </motion.div>

        {/* Community / Pro */}
        <motion.div
          className="mt-6 grid gap-px overflow-hidden rounded-lg border border-stone bg-stone md:grid-cols-2"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
        >
          <motion.div variants={fadeInUp} className="bg-white p-8">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-ink">{FEATURES.community.title}</h3>
              <Badge>{FEATURES.community.badge}</Badge>
            </div>
            <ul className="mt-6 space-y-3">
              {FEATURES.community.features.map((f) => (
                <FeatureItem key={f} feature={f} />
              ))}
            </ul>
          </motion.div>

          <motion.div variants={fadeInUp} className="bg-white p-8">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-ink">{FEATURES.pro.title}</h3>
              <Badge variant="accent">{FEATURES.pro.badge}</Badge>
            </div>
            <ul className="mt-6 space-y-3">
              {FEATURES.pro.features.map((f) => (
                <FeatureItem key={f} feature={f} />
              ))}
            </ul>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

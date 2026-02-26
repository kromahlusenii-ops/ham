"use client";

import { motion } from "framer-motion";
import { PRICING } from "@/lib/constants";
import { stagger } from "@/lib/animations";
import PricingCard from "./ui/PricingCard";

export default function Pricing() {
  return (
    <section id="pricing" className="border-t border-stone bg-white py-24 md:py-32">
      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
        >
          <p className="font-mono text-[11px] uppercase tracking-widest text-gray">
            Pricing
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink">
            Simple, transparent.
          </h2>
          <p className="mt-2 max-w-md text-sm text-gray">
            Start free with Claude Code. Pay when your team needs multi-agent
            support and enterprise features.
          </p>
        </motion.div>

        <motion.div
          className="mt-12 grid gap-6 md:grid-cols-2"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
        >
          <PricingCard {...PRICING.community} />
          <PricingCard {...PRICING.pro} />
        </motion.div>
      </div>
    </section>
  );
}

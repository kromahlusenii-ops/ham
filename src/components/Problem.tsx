"use client";

import { motion } from "framer-motion";
import { PAIN_POINTS, TOKEN_COMPARISON } from "@/lib/constants";
import { fadeInUp, stagger } from "@/lib/animations";

export default function Problem() {
  return (
    <section id="problem" className="border-t border-stone bg-snow py-24 md:py-32">
      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
        >
          <motion.p variants={fadeInUp} className="font-mono text-[11px] uppercase tracking-widest text-gray">
            The problem
          </motion.p>
          <motion.h2 variants={fadeInUp} className="mt-4 max-w-xl text-3xl font-bold tracking-tight text-ink">
            Monolithic memory files waste tokens on every request.
          </motion.h2>
        </motion.div>

        {/* Pain points */}
        <motion.div
          className="mt-12 grid gap-px overflow-hidden rounded-lg border border-stone bg-stone sm:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
        >
          {PAIN_POINTS.map((point) => (
            <motion.div key={point.title} variants={fadeInUp} className="bg-white p-6">
              <h3 className="text-sm font-semibold text-ink">{point.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray">
                {point.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Before / After */}
        <motion.div
          className="mt-16 grid gap-px overflow-hidden rounded-lg border border-stone bg-stone md:grid-cols-2"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
        >
          {/* Before */}
          <motion.div variants={fadeInUp} className="bg-white p-8">
            <p className="font-mono text-[11px] uppercase tracking-widest text-negative">
              Before
            </p>
            <h4 className="mt-3 font-medium text-ink">
              {TOKEN_COMPARISON.before.label}
            </h4>
            <p className="mt-1 text-sm text-gray">
              {TOKEN_COMPARISON.before.description}
            </p>
            <p className="mt-6 text-4xl font-bold tracking-tight text-ink">
              {TOKEN_COMPARISON.before.tokens}
              <span className="ml-2 text-sm font-normal text-gray">tokens</span>
            </p>
            {/* Bar */}
            <div className="mt-4 h-1.5 rounded-full bg-silk">
              <div className="h-full w-full rounded-full bg-negative/20" />
            </div>
          </motion.div>

          {/* After */}
          <motion.div variants={fadeInUp} className="bg-white p-8">
            <p className="font-mono text-[11px] uppercase tracking-widest text-accent">
              After
            </p>
            <h4 className="mt-3 font-medium text-ink">
              {TOKEN_COMPARISON.after.label}
            </h4>
            <p className="mt-1 text-sm text-gray">
              {TOKEN_COMPARISON.after.description}
            </p>
            <p className="mt-6 text-4xl font-bold tracking-tight text-ink">
              {TOKEN_COMPARISON.after.tokens}
              <span className="ml-2 text-sm font-normal text-gray">tokens</span>
            </p>
            {/* Bar */}
            <div className="mt-4 h-1.5 rounded-full bg-silk">
              <div className="h-full w-[50%] rounded-full bg-accent" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

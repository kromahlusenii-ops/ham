"use client";

import { motion } from "framer-motion";
import { SUSTAINABILITY_STATS } from "@/lib/constants";
import { fadeInUp, stagger } from "@/lib/animations";
import AnimatedCounter from "./ui/AnimatedCounter";

export default function Sustainability() {
  return (
    <section id="sustainability" className="border-t border-stone bg-snow py-24 md:py-32">
      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
        >
          <motion.p variants={fadeInUp} className="font-mono text-[11px] uppercase tracking-widest text-gray">
            Sustainability
          </motion.p>
          <motion.h2 variants={fadeInUp} className="mt-4 max-w-xl text-3xl font-bold tracking-tight text-ink">
            Less compute. Smaller footprint.
          </motion.h2>
          <motion.p variants={fadeInUp} className="mt-2 max-w-lg text-sm text-gray">
            Every token you don&apos;t send is energy you don&apos;t burn.
            Scoped memory directly reduces the environmental cost of
            AI-assisted development.
          </motion.p>
        </motion.div>

        {/* Counters */}
        <motion.div
          className="mt-12 grid gap-px overflow-hidden rounded-lg border border-stone bg-stone sm:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
        >
          {SUSTAINABILITY_STATS.map((stat) => (
            <motion.div key={stat.label} variants={fadeInUp} className="bg-white p-8">
              <p className="text-4xl font-bold tracking-tight text-ink">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="mt-2 text-sm font-medium text-ink">{stat.label}</p>
              <p className="mt-0.5 text-sm text-gray">{stat.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Quote */}
        <motion.blockquote
          className="mt-12 border-l-2 border-stone py-1 pl-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeInUp}
        >
          <p className="text-base leading-relaxed text-carbon">
            &ldquo;Reducing AI token consumption is one of the easiest ways
            engineering teams can lower their compute carbon footprint — without
            sacrificing productivity.&rdquo;
          </p>
          <cite className="mt-3 block text-sm not-italic text-gray">
            Built with ESG-conscious engineering in mind
          </cite>
        </motion.blockquote>
      </div>
    </section>
  );
}

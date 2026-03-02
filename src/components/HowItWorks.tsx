"use client";

import { motion } from "framer-motion";
import { HOW_IT_WORKS_STEPS } from "@/lib/constants";
import { fadeInUp, stagger } from "@/lib/animations";
import CodeBlock from "./ui/CodeBlock";

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-stone bg-white py-24 md:py-32">
      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
        >
          <motion.p variants={fadeInUp} className="font-mono text-[11px] uppercase tracking-widest text-gray">
            How it works
          </motion.p>
          <motion.h2 variants={fadeInUp} className="mt-4 max-w-xl text-3xl font-bold tracking-tight text-ink">
            Scoped context. Only what&apos;s relevant.
          </motion.h2>
        </motion.div>

        <div className="mt-16 space-y-20">
          {HOW_IT_WORKS_STEPS.map((step) => (
            <motion.div
              key={step.step}
              className="grid items-start gap-8 lg:grid-cols-[1fr_1.2fr] lg:gap-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={stagger}
            >
              <motion.div variants={fadeInUp}>
                <p className="font-mono text-[11px] text-gray">
                  {step.step}
                </p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-ink">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-gray">
                  {step.description}
                </p>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <CodeBlock>{step.code}</CodeBlock>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

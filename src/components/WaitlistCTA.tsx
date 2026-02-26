"use client";

import { motion } from "framer-motion";
import { fadeInUp, stagger } from "@/lib/animations";
import EmailForm from "./ui/EmailForm";

export default function WaitlistCTA() {
  return (
    <section id="waitlist" className="border-t border-stone bg-white py-24 md:py-32">
      <motion.div
        className="mx-auto max-w-5xl px-6 sm:px-8"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={stagger}
      >
        <motion.p variants={fadeInUp} className="font-mono text-[11px] uppercase tracking-widest text-gray">
          Early access
        </motion.p>
        <motion.h2 variants={fadeInUp} className="mt-4 max-w-md text-3xl font-bold tracking-tight text-ink">
          Get early access to HAM Pro.
        </motion.h2>
        <motion.p variants={fadeInUp} className="mt-2 max-w-md text-sm text-gray">
          Join the waitlist. Be first to know when multi-agent support, team
          analytics, and the shared memory dashboard launch.
        </motion.p>
        <motion.div variants={fadeInUp} className="mt-8">
          <EmailForm />
        </motion.div>
        <motion.p variants={fadeInUp} className="mt-3 text-[12px] text-ash">
          No spam. Unsubscribe anytime.
        </motion.p>
      </motion.div>
    </section>
  );
}

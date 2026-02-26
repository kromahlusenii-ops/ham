"use client";

import { motion } from "framer-motion";
import { stagger } from "@/lib/animations";

type SectionWrapperProps = {
  children: React.ReactNode;
  id?: string;
  className?: string;
  dark?: boolean;
};

export default function SectionWrapper({
  children,
  id,
  className = "",
  dark = false,
}: SectionWrapperProps) {
  return (
    <section
      id={id}
      className={`py-24 md:py-32 ${
        dark ? "bg-ink text-white" : "bg-white text-ink"
      } ${className}`}
    >
      <motion.div
        className="mx-auto max-w-5xl px-6 sm:px-8"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={stagger}
      >
        {children}
      </motion.div>
    </section>
  );
}

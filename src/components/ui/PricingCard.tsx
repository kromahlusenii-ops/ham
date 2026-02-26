"use client";

import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/animations";
import { Check } from "lucide-react";
import Button from "./Button";

type PricingCardProps = {
  name: string;
  price: string;
  period: string;
  description: string;
  features: readonly string[];
  cta: string;
  ctaHref: string;
  highlighted?: boolean;
};

export default function PricingCard({
  name,
  price,
  period,
  description,
  features,
  cta,
  ctaHref,
  highlighted = false,
}: PricingCardProps) {
  return (
    <motion.div
      variants={fadeInUp}
      className={`rounded-lg border p-8 ${
        highlighted ? "border-ink bg-ink text-white" : "border-stone bg-white"
      }`}
    >
      <p className={`font-mono text-[11px] uppercase tracking-widest ${
        highlighted ? "text-ash" : "text-gray"
      }`}>
        {name}
      </p>

      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight">{price}</span>
        <span className={`text-sm ${highlighted ? "text-ash" : "text-gray"}`}>
          / {period}
        </span>
      </div>

      <p className={`mt-3 text-sm ${highlighted ? "text-ash" : "text-gray"}`}>
        {description}
      </p>

      <div className="mt-6">
        <Button
          variant={highlighted ? "secondary" : "primary"}
          href={ctaHref}
          className="w-full"
        >
          {cta}
        </Button>
      </div>

      <ul className="mt-8 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
              highlighted ? "text-accent-muted" : "text-accent"
            }`} />
            <span className={`text-sm ${highlighted ? "text-ash" : "text-carbon"}`}>
              {feature}
            </span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

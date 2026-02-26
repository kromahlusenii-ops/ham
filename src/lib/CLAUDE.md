# Lib Context

## Purpose
Shared data, copy, and animation presets used across components.

## Conventions
- `constants.ts` — all marketing copy, feature lists, pricing data, nav links, footer links as `const` exports
- `animations.ts` — Framer Motion `Variants` presets (`fadeInUp`, `fadeIn`, `staggerContainer`, `scaleIn`, `slideInLeft`, `slideInRight`)

## Patterns
- All data arrays use `as const` for type narrowing
- Animation variants follow `hidden` → `visible` naming convention

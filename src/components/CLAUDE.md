# Components Context

## Purpose
All page sections and shared UI primitives for the landing page.

## Conventions
- Page sections: `Header`, `Hero`, `Problem`, `HowItWorks`, `Features`, `Pricing`, `Sustainability`, `WaitlistCTA`, `Footer`
- Shared UI primitives live in `ui/` subfolder: `Button`, `Badge`, `SectionWrapper`, `EmailForm`, `FileTree`, `CodeBlock`, `PricingCard`, `FeatureItem`, `AnimatedCounter`
- Components use Framer Motion variants from `@/lib/animations`
- Data/copy imported from `@/lib/constants` — never hardcoded in components

## Patterns
- `SectionWrapper` handles shared padding + scroll-reveal animation
- `"use client"` only on components using hooks, motion, or browser APIs
- Alternating dark/light sections: dark = `bg-forest-950`, light = `bg-forest-50`

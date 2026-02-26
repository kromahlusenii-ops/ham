# App Context

## Purpose
Next.js App Router entry point — root layout, global styles, and page composition.

## Conventions
- `layout.tsx` sets Inter + JetBrains Mono fonts, metadata, and OG tags
- `globals.css` defines all design tokens via Tailwind `@theme inline` (forest palette, accent colors)
- `page.tsx` composes all section components in order — no logic here

## Patterns
- Dark mode is always on (`<html class="dark">`)
- Smooth scroll enabled via CSS `scroll-behavior: smooth`

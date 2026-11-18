# 0009: Cyanotype blueprint design language on Tailwind tokens

**Status:** Accepted (Phase 0)

## Decision
A dark, cyanotype-blue drawing sheet: chalk lines and text on blueprint blue, pencil gold for decisions made and primary actions, redline coral only for critical gaps. Archivo (expanded) for headings, IBM Plex Sans for body, IBM Plex Mono only for prompt and code text. The signature element is the floor plan: twelve domains as rooms that resolve with pencil hatching. Tokens live in `src/app/globals.css`; primitives in `src/components/ui`. Details: `docs/design-system.md`.

Tailwind CSS v4 with hand-built primitives was chosen over shadcn/ui: the product needs few components, and the distinctive look would mean restyling most of shadcn anyway. Revisit for complex widgets (dialogs, comboboxes) in Phase 1, where Radix primitives can be added without its default styling.

Fonts are self-hosted from npm (`@fontsource`), so builds need no network and no third-party font requests.

## Consequences
Light mode is not implemented. The tokens are centralised, so adding it is a token task, not a rewrite.

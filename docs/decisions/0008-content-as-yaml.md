# 0008: Learning content as validated YAML in Git

**Status:** Accepted (Phase 0)

## Decision
Decision Cards and Lab content are YAML files in `/content`, validated by Zod schemas in `src/domain/content/` on every load, cross-checked by `pnpm content:check`, and rendered into static pages at build time. Prose supports paragraphs and `inline code` only, rendered without HTML injection.

Versioning: each card has an integer `version` (bump for substantive changes) and `updated` date; Blueprint decisions will record the card version they were made with. `status: draft | reviewed` shows review state honestly in the UI.

## Alternatives
MDX (rich, but invites layout code into content and complicates validation), a headless CMS (cost, another login, harder for agents), database-stored content (no review history).

## Consequences
Content changes are reviewed like code. Translations later become parallel fields or files keyed by locale, validated by the same schema.

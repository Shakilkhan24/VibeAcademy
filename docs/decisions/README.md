# Architecture decision records

Each record states the context, the decision, the alternatives considered and the consequences. Add a new record (next number) when a decision is significant, hard to reverse, or likely to be questioned later. Supersede a record instead of editing its decision.

| # | Decision | Status |
| --- | --- | --- |
| [0001](0001-single-app.md) | One Next.js app with enforced internal boundaries | Accepted |
| [0002](0002-deterministic-scoring.md) | AI classifies, deterministic code scores | Accepted |
| [0003](0003-database.md) | One Postgres schema: PGlite in dev and tests, Postgres in production | Accepted |
| [0004](0004-ai-gateway.md) | A single AI gateway with provider and feature seams | Accepted, amended by 0011 |
| [0005](0005-prompt-privacy.md) | Raw prompts are never stored, logged or returned | Accepted |
| [0006](0006-rate-limits.md) | Rate limits as Postgres fixed windows | Accepted |
| [0007](0007-analytics.md) | First-party analytics in Postgres | Accepted |
| [0008](0008-content-as-yaml.md) | Learning content as validated YAML in Git | Accepted |
| [0009](0009-design-language.md) | Cyanotype blueprint design language, built on Tailwind tokens | Accepted |
| [0010](0010-authentication.md) | Authentication for Phase 1 | Proposed: awaiting founder |
| [0011](0011-rules-first-ai-deferred.md) | Rule-based X-Ray by default; AI features deferred | Accepted |
| [0012](0012-tutorial-markdown.md) | Plain Markdown with validated YAML frontmatter for tutorials | Accepted |

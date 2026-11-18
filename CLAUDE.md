# CLAUDE.md

Claude Code reads this file automatically. The project's instructions live in AGENTS.md so every coding agent shares one source of truth:

@AGENTS.md

## Claude Code specifics

- Begin each session by reading START_HERE.md and docs/status.md.
- Before finishing a task, run `pnpm verify`, and for UI work run the app and check the changed pages.
- When you finish a milestone task, update docs/status.md and, if architecture changed, add an ADR.

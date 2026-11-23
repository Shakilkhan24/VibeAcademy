# SeniorSeat

Vibe like a beginner. Decide like a senior.

SeniorSeat shows vibe coders which engineering decisions their prompts leave to the AI, teaches each decision at the right depth and moment, and proves that better decisions produce better software.

Open `/learn` to follow the seven-chapter learning path. Dream has three reviewed tutorials on choosing one person and one job, sketching the first workflow, and writing a testable build prompt. Blueprint continues the bakery example with three draft lessons on storing orders, deciding who can see or change them, and recording those rules in a spec. Readers can mark lessons complete in their browser. [Authoring guide](docs/content-guide.md)

The Prompt X-Ray uses server-side rules and needs no API key. It connects prompt decisions to five Decision Cards approved for the initial release as drafts. The app also includes the Twin Builds Lab foundation, a waitlist and a transparency page. This milestone is available as verified source on GitHub. Public deployment is deferred. [Milestone status](docs/status.md)

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm verify     # typecheck, lint, tests, content check, production build
```

- New here (person or AI agent)? Read [START_HERE.md](START_HERE.md).
- Working agreement for coding agents: [AGENTS.md](AGENTS.md). Prompts for handing work over: [docs/agent-prompts.md](docs/agent-prompts.md).
- Design direction (founder-owned): [docs/design-brief.md](docs/design-brief.md).
- What exists and what does not: [docs/status.md](docs/status.md).
- What was generated and how it was verified: [GENERATION_REPORT.md](GENERATION_REPORT.md).

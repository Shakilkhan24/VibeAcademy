# Product context

SeniorSeat teaches people who build software with AI ("vibe coders") to make the engineering decisions a senior engineer makes. The AI writes the code; the learner makes the calls.

## The problem

A vague prompt leaves the builder to decide where data lives, who may see it, where keys go, what happens when things break and what it costs. In 2025, Escape reported finding more than 2,000 vulnerabilities and over 400 exposed secrets across the more than 5,600 publicly accessible apps it examined. Decisions about access and credentials give learners two concrete things to check in their own apps. [Escape's account of its study](https://escape.tech/blog/methodology-how-we-discovered-vulnerabilities-apps-built-with-vibe-coding/)

## Philosophy (product-defining)

**Teach decisions, not tools. Teach at the right depth, at the right moment, and prove that better decisions produce better software.**

Principles every feature must respect:

- Respect and empower vibe coders. Never portray them as incompetent; the villain is "silent decisions", never the learner.
- Focus on engineering decisions rather than the buttons of any one tool.
- Make technical concepts accessible without sacrificing accuracy.
- Deliver learning in context, when the learner's app needs that decision.
- Connect every meaningful learning experience to a practical outcome (a prompt line, a spec, a passed check).
- Prefer measurable proof over marketing claims.
- Serve beginners and experienced developers from the same content foundation.

## Learning architecture (product-defining)

These are fixed concepts. Changing them needs the founder and an ADR.

**Twelve decision domains** (`src/domain/taxonomy/domains.ts`): product and scope; planning and specs; Git and workflow; front end; back end and APIs; data; identity and access; security and secrets; deployment and cloud; reliability and operations; scale and performance; cost and business.

**Five Depth Dial levels** (`src/domain/taxonomy/learning.ts`): Story, Practical, Technical, Engineer, Senior.

**Seven App Life Path chapters**: Dream, Blueprint, First build, Launch, First 100 users, Going viral, Growing up.

**Eight-part Decision Card** (`src/domain/content/card-schema.ts`): question, moment, if you stay silent, options with trade-offs, cost and effort, prompt line, prove it, go deeper (five depths plus related cards).

**Ranks**: Dreamer, Prompter, Builder, Shipper, Operator, Architect, Mentor, earned with proof (Phase 1+).

**The loop**: the app reaches a moment, the learner opens the card, decides, the Blueprint gains a line, the learner builds with their AI tool, then proves it. Learning always ends in a saved decision and a check.

## The experiences, and how they connect

| Experience | Role | Phase |
| --- | --- | --- |
| Tutorials | Longer, hands-on lessons (Git, databases, cloud, DevOps, observability, security, cost and more) ordered by the App Life Path and written at a chosen depth. The main reason learners return. Written by the founder with Claude Code. | 0 (M1: first chapter), then every phase |
| Prompt X-Ray | Reveals the silent decisions in any prompt. Free hook and the first proof of value. Runs on a rule-based check; AI-assisted analysis is deferred (ADR 0011). | 0 (built) |
| Decision Cards + Depth Dial | Teach one decision each, at five depths. | 0 (5 cards), 1 (30), 2 (70), 3 (120) |
| App Life Path | Orders cards by the moment an app meets them. | 0 (static map), 1 (personal path) |
| Blueprint | The learner's decisions, collected per project. | 1 |
| Build Pack | Blueprint rendered as AGENTS.md, SPEC.md, TASKS.md and tool adapters. | 0 (AGENTS.md starter from X-Ray), 1 (full) |
| Twin Builds Lab | Same app built twice and tested identically; public proof. | 0 (foundation), 2 (results) |
| Crash Theater | Simulated production incidents. | 1 (one scenario), 2 |
| Reality Check | Passive, ownership-verified scan of a learner's live app; the Reality Score. | 2 |
| Senior in the Seat | AI mentor grounded in the card library. Deferred with the other paid-AI features. | Later |
| SeniorSeat agent skill | The curriculum inside the learner's coding tool. | 3 |

Tutorials, the X-Ray, the cards and the Build Pack share one taxonomy (a tutorial lists the decisions it covers): every X-Ray finding links to a decision, every decision to a card, every card option to a prompt line, and every prompt line can enter a Blueprint. Keep that chain intact.

## Audience

Global, English first. Learners range from non-technical founders using Lovable or Bolt to professional developers using Cursor or Claude Code. One content library serves all of them through the Depth Dial.

## Business model (hypotheses, not requirements)

Freemium: free X-Ray and Lab; paid Builder and Pro plans; credits; team and campus plans; scarce human reviews. All prices in the product plan are hypotheses to test with the waitlist. See [open-decisions.md](open-decisions.md). Do not hard-code prices into the product until the founder confirms them.

# 0011: Rule-based X-Ray by default; AI features deferred

**Status:** Accepted (2026-11-18, founder decision). Amends [0004](0004-ai-gateway.md).

## Context

Phase 0 shipped an AI gateway with an Anthropic provider and a keyword-rule "simulated" provider. The simulated provider was meant for development only, and production refused to run without an API key. The founder has since set the direction:

- SeniorSeat is first a tutorials website.
- Comparisons and other content are produced offline with Claude Code under the founder's own instructions.
- Running real prompts through a paid API is not worth the cost at this stage.

## Decision

- The rule-based check is the default X-Ray engine in every environment, production included. Its provider is named `rules` (formerly `simulated`), results carry `mode: "rules"`, and every surface labels them "Rule-based check".
- The Anthropic provider stays in the codebase as a deferred placeholder. It is used only when `AI_PROVIDER=anthropic` is set explicitly; an API key on its own never switches it on. `ALLOW_SIMULATED_AI` is removed.
- The gateway, the cache, the budget and the usage ledger stay in place, so switching AI on later is a configuration change plus a measurement, not a rewrite. The rule-based provider goes through the same gateway at zero cost.
- `/privacy` states that prompts are not sent to any AI provider while the rule-based check is in use.

## Alternatives considered

- **Delete the AI code.** This is simpler today, but the gateway is small, fully tested and costs nothing while it is off; rebuilding it later would cost more.
- **Hide the X-Ray until AI is on.** This would lose the product's most distinctive interactive moment. The rule-based check is useful when it is labelled honestly.
- **Keep "simulated" as a demo mode.** That naming implied the result was a fake. The rule-based check is a real, deterministic method with known limits, and it should be described as one.

## Consequences

- AI spend is zero. The `/open` AI figures stay at zero and say why.
- Quality is limited by the keyword rules: they miss decisions phrased in unusual words and can credit a decision that is only mentioned. M1 adds hand-labelled fixtures and improves the patterns with tests.
- Switching AI on later follows "Later: AI features" in [roadmap.md](../roadmap.md), and the rule-based check remains the fallback.
- Rows stored before this change in a local development database may still have `mode = 'simulated'`. Production has no such rows; reset the local database (delete `.data/pglite`) if they matter.

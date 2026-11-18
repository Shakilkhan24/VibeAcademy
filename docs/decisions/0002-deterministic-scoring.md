# 0002: AI classifies, deterministic code scores

**Status:** Accepted (Phase 0)

## Context
The X-Ray score must be explainable, reproducible and testable. Asking a model for a score would make it unexplainable and drift between runs and models.

## Decision
The model does exactly one thing: for each of the 36 decisions, report `addressed`, `partial` or `missing`, plus seven app traits, the app type and the language. Everything else is deterministic code in `src/domain/xray/`:
- Applicability from traits (`appliesTo`).
- Score = round(100 × Σ weight × value / Σ weight) over applicable decisions; value 1 / 0.5 / 0.
- Missing critical decision caps the score at 60.
- Top risks: critical first, then missing before partial, then weight, then taxonomy order.
- Upgraded prompt: the learner's words plus the prompt line of each unresolved decision.

Versions: `TAXONOMY_VERSION`, `SCORING_VERSION`, `XRAY_PROMPT_VERSION`, `UPGRADE_VERSION`, stored with every run.

## Alternatives
- **Model produces score and rewrite:** richer prose, but non-reproducible, more expensive, can invent requirements, and leaks prompt content into stored output.

## Consequences
- Scores can be explained line by line and regression-tested.
- Quality depends on classification accuracy: M1 adds a labelled set of real prompts as regression fixtures.
- The classification contains no prompt text, which makes caching and storage privacy-safe (ADR 0005).

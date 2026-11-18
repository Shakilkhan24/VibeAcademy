# 0004: A single AI gateway with provider and feature seams

**Status:** Accepted (Phase 0)

## Context
AI cost and behaviour must be controlled centrally: budgets, caching, limits, errors, model choice. The runtime provider must stay configurable, and development must work without keys.

## Decision
- `AiGateway.run(feature, input, { cacheKey })` is the only way to call a model.
- `AiProvider` seam: Anthropic (Messages API, structured outputs via `output_config.format`, plain `fetch`) and a simulated keyword provider for development. Adding OpenAI or a local model means one new provider file.
- `AiFeature` seam: prompt, schemas, versions, token cap and cache TTL per product use.
- The gateway handles cache, daily budget (micro-USD ledger), timeout, one retry, validation and usage recording (including failures and cache hits). Cache keys include provider and model, so simulated output can never be served as AI output.
- Product limits (per-visitor rate limits, kill switches) live in services.

## Alternatives
- **Vendor SDK called from routes:** fastest to write, impossible to budget and audit.
- **Third-party AI gateway service:** another vendor and data processor for prompts; unnecessary at this scale.
- **Anthropic SDK inside the provider:** fine, but the API surface used is one endpoint; `fetch` keeps the provider dependency-free and trivially mockable.

## Consequences
- Every AI cent is in `ai_usage` and visible on `/open`.
- `MODEL_PRICING` in `src/server/ai/pricing.ts` must be updated when models or prices change. Unknown models are costed at the most expensive known rate.

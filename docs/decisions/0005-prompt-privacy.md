# 0005: Raw prompts are never stored, logged or returned

**Status:** Accepted (Phase 0)

## Context
Prompts often contain an unreleased business idea. Trust is the product's foundation.

## Decision
- The prompt exists only inside the X-Ray request. It is sent to the AI provider (in AI mode), HMAC'd with `HASH_SECRET` for the cache key, then dropped.
- Stored: classification statuses, traits, coarse app type, language code, scores. No free text from the prompt.
- The API response never echoes the prompt; the browser builds the upgraded prompt from its own copy plus decision lines.
- Sharing is opt-in, by an owner token; share pages and images show score, coverage and top risks only.
- Owners can delete a run; IPs are stored only as HMACs.
- `tests/server/xray-service.test.ts` searches every table for a unique prompt phrase.

## Consequences
- Some analytics are impossible by design (for example "which prompts score lowest"). Accept this.
- Any future feature that needs prompt text (for example saving prompts in a signed-in project) must be explicit, opt-in, deletable, and get its own ADR.

# Privacy: data inventory

Engineering record of exactly what SeniorSeat stores. Keep it in sync with `src/server/db/schema.ts` and the public `/privacy` page. Any change that stores new personal data or anything derived from prompt text needs an ADR (see ADR 0005).

## What is never stored

- Raw prompt text, in any table, cache, log or response.
- Any free text produced from the prompt (the classifier output has no free-text fields).
- Raw IP addresses.
- Owner tokens in the clear.

## Tables

| Table | Personal or sensitive data | Retention | Deletion |
| --- | --- | --- | --- |
| `xray_runs` | HMAC of prompt (cache key), HMAC of IP, hash of owner token, classification statuses, traits, coarse app type, language code, scores | Indefinite (aggregate product data) | Owner deletes via the result page (`DELETE /api/xray`) |
| `ai_cache` | Classification JSON keyed by prompt HMAC | 30 days (expires) | Expiry; manual purge possible |
| `ai_usage` | None (feature, model, tokens, cost, outcome) | Indefinite | n/a |
| `rate_limits` | HMAC of IP in the key | Pruned after about 2 days | Automatic |
| `waitlist_entries` | Email, chosen tool, experience, source, consent time | Until launch email + a reasonable period (founder to decide) | On request (manual until accounts exist) |
| `events` | None (event name, coarse properties) | Indefinite | n/a |

## Processors

Tutorial completion is stored locally by lesson slug using the browser's local storage. The reader keeps an in-memory fallback when storage is unavailable. Marking a lesson incomplete removes its completion record. The server receives no completion events.

- With the rule-based check (the default, ADR 0011), the prompt never leaves our server. If AI-assisted analysis is switched on later, the AI provider receives the prompt for a single request under its API data terms: verify its retention and training terms first and update `/privacy` before switching.
- Hosting and database providers (once chosen) store the tables above.

## Before public launch

- A reviewed privacy policy and terms (open decision 9).
- A published contact for deletion requests (open decision 10).
- Re-run the prompt-leak test against a copy of production data.

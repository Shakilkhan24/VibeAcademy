# Privacy: data inventory

Engineering record of exactly what VibeAcademy stores. Keep it in sync with `src/server/db/schema.ts` and the public `/privacy` page. Any change that stores new personal data or anything derived from prompt text needs an ADR (see ADR 0005).

## What is never stored

- Raw text submitted to the X-Ray, in any table, cache, log or response.
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
| `waitlist_entries` | Email, chosen tool, experience, source, consent time | Until launch email + a reasonable period (founder to decide) | On a verified request using the procedure below |
| `lesson_feedback` | Yes/Not yet, optional private comment (500 characters), and a submission-specific event key. No IP, rate-limit key or account reference. | No automatic expiry | Maintainers can delete a response by its event key |
| `events` | Lesson events contain the slug and version. Other events use coarse properties. A new waitlist signup records whether it used the X-Ray link. | Indefinite | n/a |

## Delete a waitlist signup

1. Receive the deletion request at `automateanything2@gmail.com`. Confirm control of the address on the request. Send a confirmation to the exact address being removed and wait for a reply before changing the database. Keep the address and correspondence in the private mailbox.
2. Connect to the intended database using your configured PostgreSQL service. Check its identity with `psql -X -d service=vibeacademy -c '\conninfo'`. Substitute the service name for the environment you intend to operate. The operator needs permission to read the email and delete a waitlist row, insert an event and read its returned date.
3. From the repository root, run the following with a PostgreSQL 17 client in a private terminal. Enter the verified address at the prompt. The script binds it as a query parameter. The address stays out of the command line and shell history.

   ```bash
   psql -X -d service=vibeacademy -f scripts/delete-waitlist-entry.sql
   ```

4. One returned UTC date confirms deletion of the matching signup, including its consent and optional survey answers. Zero rows means the address is already absent. Deletion and the audit entry commit in one statement. If the connection drops before a result arrives, reconnect and retry the same verified address.
5. Confirm to the requester that the address is absent from the active waitlist. The script logs a `waitlist_deleted` event with the UTC date, a new random event ID and empty properties. Keep the address, row ID and correspondence out of any separate deletion log. Earlier aggregate signup events have no email or signup ID.

The lookup uses the stored lowercase address and trims surrounding spaces. A repeat request creates no additional deletion event. When configuring the hosting provider, check database parameter logging and backup retention separately. A restored backup can contain older signups. [Operator script](../scripts/delete-waitlist-entry.sql) · [PostgreSQL 17 psql commands](https://www.postgresql.org/docs/17/app-psql.html)

## Application failure logs

A server-side API failure produces one JSON line on standard error with the UTC time, a fixed handler name, HTTP status and error code. A failed analytics write records the time and the event name. For uncaught request failures, the Next.js hook records the time, the route kind and a fixed site area such as `learn` or `x`. A shared-result lookup replaces database exceptions before they reach the page renderer because those exceptions can contain the share slug. [Next.js request error hook](https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation#onrequesterror-optional)

The application writes these records directly to standard error so a database outage can still be reported. They omit exception text, SQL parameters, request URLs, headers and bodies. The hosting provider's access logs, framework diagnostics and retention settings also need review at deployment.

## Processors

Tutorial completion is stored locally by lesson slug using the browser's local storage. The reader keeps an in-memory fallback when storage is unavailable. Marking a lesson incomplete removes its completion record. A completion mark sends the slug, version and a random submission key scoped to that lesson version. An offline mark still updates local progress. Undoing it changes the browser checklist. The server counts accepted marks across versions and treats a retried submission as one mark.

Feedback comments stay in the private table. The public query returns completion counts, response counts and helpful rates only for lessons with at least ten votes. The feedback quota uses the same hourly limit as signups, with its own counter. Completion marks have a separate limit of 60 per hour. [Lesson feedback decision](decisions/0013-lesson-feedback.md)

- With the rule-based check (the default, ADR 0011), the prompt never leaves our server. If AI-assisted analysis is switched on later, the AI provider receives the prompt for a single request under its API data terms: verify its retention and training terms first and update `/privacy` before switching.
- Hosting and database providers (once chosen) store the tables above.

## Before public launch

- Publish the reviewed privacy policy and terms when the founder supplies the source text.
- Choose the waitlist email provider at deployment. The founder deferred double opt-in until then.
- Re-run the prompt-leak test against a copy of production data.

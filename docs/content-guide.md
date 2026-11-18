# Content guide: writing Decision Cards

Cards are the product's core teaching asset. They live in `content/cards/<slug>.yaml`, are validated by `src/domain/content/card-schema.ts`, and are checked with `pnpm content:check`.

## The eight parts

| Part | Field | Rule |
| --- | --- | --- |
| 1. The question | `question` | Plain words a non-technical builder understands. |
| 2. The moment | `moment` | When this decision becomes urgent in an app's life. |
| 3. If you stay silent | `ifSilent` | What the AI tends to do by default and what goes wrong. No scare tactics; cite evidence in `sources`. |
| 4. Options | `options[]` (2–4) | Real choices with `pros` and `cons`. At most one `recommended`. |
| 5. Cost and effort | `options[].cost`, `.effort` | Honest and general; no invented prices. |
| 6. Prompt line | `options[].promptLine` | An instruction the learner can paste. Brackets mark their choices. |
| 7. Prove it | `proveIt.steps`, `proveIt.passWhen` | A check the learner can run on their own app, with a clear pass condition. |
| 8. Go deeper | `depths` (5), `related` | Story, Practical, Technical, Engineer, Senior. |

## The five depths

| Depth | Voice | Test |
| --- | --- | --- |
| Story | Everyday analogy, no jargon | Would a shop owner who has never coded nod along? |
| Practical | What to tell the AI and what to check | Could they act on it today? |
| Technical | Real terms, defined in passing | Do they now know the words their tools use? |
| Engineer | Implementation and failure modes | Would a developer learn a pitfall? |
| Senior | Trade-offs at scale | Would a senior engineer agree with the framing? |

## Style

Sentence case. Short sentences. Active voice. No product shilling: name tools as examples ("such as Supabase or Neon"), never as the only answer. Facts that could be disputed need a source in `sources`. Prices are described qualitatively unless sourced and dated.

## Linking to the taxonomy

- `decisionIds` lists the taxonomy decisions this card teaches.
- Each of those decisions must have `cardSlug` pointing back to this card (the content check enforces both directions).
- `chapter`, `domain` and `minRank` place the card on the App Life Path.

## Versioning and review

- Bump `version` when facts, options or prompt lines change. Do not bump for typo fixes.
- Update `updated` (YYYY-MM-DD) on every change.
- New cards start as `status: draft`. After a second engineer reviews them, set `reviewed`. The UI shows drafts as drafts.
- Changing a decision's classifier criteria (`addressedWhen` / `partialWhen` in `src/domain/taxonomy/decisions.ts`) changes X-Ray behaviour: bump `TAXONOMY_VERSION`.

## Lab content

`content/lab/methodology.yaml` defines the rules and the 11 metrics. Episodes in `content/lab/episodes/` cannot carry measurements until `status: published`, and a published episode must have every metric for both twins, `artifactsUrl` and `publishedAt`. Never type a number that was not measured.

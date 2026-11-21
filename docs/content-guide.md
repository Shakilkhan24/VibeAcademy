# Content guide

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

## Writing a tutorial with Claude Code

1. Choose the audience, decision, App Life Path chapter and depth. Give Claude Code those choices, your own notes, a worked example and the sources you trust. Use the five depth voices above when describing the audience.
2. Copy [the template](../content/tutorials/_template.md) to `content/tutorials/<slug>.md`. Set the title, summary, date, estimated reading time, and taxonomy IDs. The chapter sets the broad sequence. An optional positive integer `order` places a tutorial within its chapter. Unnumbered tutorials follow numbered ones, and ties sort by slug.
3. List required earlier lessons in `prerequisites` and the Decision Cards the lesson covers in `relatedCards`. Both fields take slugs. Start with `status: draft`. The template itself never counts as a lesson.
4. Ask Claude Code to draft the body at the selected depth. Use Markdown headings for sections, fenced blocks for code and blockquotes for callouts. Name the practical choice, show its trade-offs and finish with a check the learner can run. Cite original sources alongside factual claims and every statistic.
5. Run every example and the final check yourself. Confirm the links open, the decision matches its cards, and the example works at the stated depth. Run `pnpm content:check` to validate the file and references. The founder marks the lesson `reviewed` after editorial review. Update `updatedAt` on edits and increment `version` when the teaching changes.

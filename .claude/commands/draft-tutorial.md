---
description: Draft one SeniorSeat tutorial from the founder’s brief and validate it for the learning path.
argument-hint: "[topic, audience, chapter, depth and teaching notes]"
disable-model-invocation: true
---

Draft one tutorial using the following author brief.

$ARGUMENTS

Use the brief and any teaching notes already supplied in the conversation. If the topic or intended learner is unclear, ask for the missing detail before writing. Follow the founder’s chapter and depth choices, or use the learner’s experience and the decision they face to choose a fit.

Read `docs/content-guide.md` and `content/tutorials/_template.md`. Check the chapter, depth and domain IDs in `src/domain/taxonomy/`. Look at existing lessons and Decision Cards for the slugs you reference.

Create `content/tutorials/<slug>.md` from the template with an unused lowercase, hyphenated slug. Use the same slug in the frontmatter, set today’s `updatedAt`, and start at version 1 with `status: draft`. Preserve existing lessons, including any draft with a similar title.

Teach the decision through a worked example. Give the learner an action to try and an observable result they can use to check their work. Use the author’s notes and cite original sources beside factual claims. Run any runnable example and report what you actually checked.

Run `pnpm content:check` from the repository root and resolve errors introduced by the new file. Return the file path and its local reader path, `/learn/<slug>`, for editorial review.

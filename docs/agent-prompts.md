# Prompts for handing work to your coding agent

Paste-ready prompts for running this project with a coding agent (written for Claude Code with Opus 5.5, but any agent that reads `AGENTS.md` works). The agent already gets the working rules from `CLAUDE.md` and `AGENTS.md`, so these prompts only say what to do now.

**How to run sessions:**

- Do one roadmap step per session.
- Ask for a plan first and approve it before any code.
- Review the diff, then commit.
- Start a fresh session for the next step. `docs/status.md` carries the memory between sessions, so make sure the agent updates it.

## 1. First session: get oriented, no code

```text
Read START_HERE.md, AGENTS.md, docs/status.md, docs/roadmap.md, docs/open-decisions.md
and docs/design-brief.md. Run `pnpm install` and `pnpm verify` and tell me the result.

Then give me:
1. A short summary of what exists and what M1 asks for, in your own words.
2. A step-by-step plan for M1, one line per step, each with how you will verify it.
3. Questions for me: anything in docs/open-decisions.md or the design brief that blocks a step.

Do not change any files in this session.
```

## 2. Design pass (after you mark the design brief "Ready for the agent")

```text
Read docs/design-brief.md and docs/design-system.md, and look at docs/screenshots/.
Propose a design plan: palette as named hex values, typefaces and their roles, the layout
of the home, /learn and tutorial pages (ASCII wireframes are fine), and the one memorable
element. Show me the plan and wait for my approval.

After I approve: implement it in src/app/globals.css, src/components/ui and the existing
pages. Run the app and check every page on desktop and mobile widths. Run `pnpm verify`.
Update docs/design-system.md, add an ADR if the design language changed, update docs/status.md.
```

## 3. The next roadmap step

```text
Take the next unfinished step of the current milestone in docs/roadmap.md
(check docs/status.md for what is done). Write the plan first: files you will touch,
tests you will add, risks, and how you will verify. Wait for my approval.

Then implement it in small commits. Run `pnpm verify`; for UI work, run the app and look
at the changed pages. Update docs/status.md. Finish with: what changed, how you verified
it, assumptions you made, and anything that needs my decision.
```

## 4. Write a tutorial (you author, the agent drafts)

In Claude Code, use `/draft-tutorial` followed by your brief. For another coding agent, use the prompt below. [Authoring guide](content-guide.md)

```text
Draft a tutorial from content/tutorials/_template.md following docs/content-guide.md.
Topic: <topic>. Chapter: <one of the 7>. Level: <depth>. Audience: <who, what they know>.
My notes and the points it must make: <paste your notes>.

Rules: plain words, every technical term explained at first use, no invented statistics
(cite a source for every number), code that actually runs, and a "prove it" check the
reader can do on their own app. Mark it status: draft. Run `pnpm content:check` and
show me the rendered page at /learn/<slug>.
```

## 5. Produce a Twin Builds comparison (offline)

```text
We are producing Lab episode <n> following lab/README.md and content/lab/methodology.yaml.
Twin A is built from this vague prompt: <prompt>. Twin B is built from the same idea plus
these decisions: <decisions or a Build Pack>. Help me build both, then run each harness
step in lab/README.md against both deployments with identical settings, save the raw
output to lab/results/raw/, and fill in content/lab/episodes/<file>.yaml with measured
values only. Never estimate a metric: leave the episode unpublished if one is missing.
```

## 6. End of a session

```text
Before we stop: make sure docs/status.md reflects exactly what is done, partly done and
not started, with how each item was verified. List open questions for me at the end of
docs/status.md. Run `pnpm verify` one last time and tell me the result.
```

## Things to keep in your own hands

These belong to you, so the agent should only bring them to you with options:

- the design brief;
- tutorial topics and reviewing the drafts;
- everything in `docs/open-decisions.md` (prices, payments, auth, vendors, legal text);
- whether to switch on any paid AI feature.

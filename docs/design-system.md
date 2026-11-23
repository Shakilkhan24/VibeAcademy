# Design system

VibeAcademy looks like an engineer's drawing sheet: chalk lines on cyanotype blue. Decisions you have made are drawn in pencil; critical gaps are marked in redline. The design should feel calm, technical and approachable, never like a generic SaaS dashboard.

## Principles

1. **Structure is information.** Borders, rooms, scales and numbers encode something real (a domain, a band, a rank in a ranked list). No decorative eyebrows, no numbered markers on things that are not sequences.
2. **One strong colour.** Pencil gold marks the main action on a screen and decisions made. Redline coral appears only for critical gaps. Everything else is chalk on blue.
3. **One orchestrated motion.** The floor plan resolving after an X-Ray. Everything else stays still unless the user acts. `prefers-reduced-motion` disables it.
4. **Copy is design.** Sentence case, plain verbs, specific errors that say what to do next. Never mock vibe coders.

## Tokens (`src/app/globals.css`)

| Token | Value | Use |
| --- | --- | --- |
| `paper` | `#0f2d4e` | Page background (cyanotype) |
| `paper-deep` | `#0b2440` | Inputs, sheets, code |
| `paper-raised` | `#153a61` | Hover surfaces |
| `chalk` | `#e8eff6` | Primary text and lines |
| `chalk-dim` | `#a7bcd1` | Secondary text (about 6.5:1 on paper) |
| `line` / `line-strong` | chalk at 16% / 34% | Rules, borders, room walls |
| `pencil` | `#f2c14e` | Primary action, decisions made, focus ring |
| `pencil-ink` | `#0b2440` | Text on pencil |
| `redline` | `#ff8b7b` | Critical gaps only |

The page background carries a two-level drawing grid (8 px and 64 px).

## Type

| Role | Face | Notes |
| --- | --- | --- |
| Headings | Archivo Variable, width 108–122%, weight 600–680 | Expanded architectural lettering; `text-wrap: balance` |
| Body | IBM Plex Sans Variable, 17 px / 1.65 | Measure about 66 characters (`text-measure`) |
| Prompts and code | IBM Plex Mono | Only where the text is literally code or a prompt |

Scale tokens: `text-micro` 13, `text-small` 15, `text-body` 17, `text-h3` 21, `text-h2` 28, `text-h1` fluid 36–58 px. Fonts are self-hosted from `@fontsource` packages.

## Signature elements

The founder retained this design for M1. The learning path groups tutorials by chapter and shows reading depth, estimated time and editorial state. The reader uses a 66-character text measure, linked section headings, pencil-edged callouts, copyable examples and previous/next lesson navigation. Its desktop sidebar moves above the article on narrow screens.

- **Floor plan** (`components/xray/floor-plan.tsx`): twelve domains as rooms with shared walls. Dashed walls = undecided; pencil hatching = decided share; redline wall = critical gap; "Not needed" = domain does not apply.
- **Score scale** (`components/xray/score-scale.tsx`): the score as a dimension line with the four bands and a pencil marker; the critical cap is a dashed redline.
- **Sheet** (`.sheet`): a panel with corner registration ticks, for forms, option sheets and featured content.
- **Option sheet** (`components/cards/option-sheet.tsx`): one decision option with gains, costs, money, effort and a copyable prompt line.
- **Depth Dial** (`components/cards/depth-dial.tsx`): a five-stop radio group (arrow keys move between depths).
- **Title block** (footer): real project metadata, including the taxonomy and scoring versions in use.

## Primitives (`src/components/ui`)

`Button` / `ButtonLink` (primary, secondary, quiet), `Input`, `Textarea`, `Select`, `Checkbox`, `Label`, `Notice` (info, caveat, error, success; caveat carries the "Rule-based check" label), `Tag` (plain, pencil, redline, dashed), `CopyButton`, `Prose` (safe paragraphs + inline code). Reuse these before adding new ones.

## Accessibility checklist

- Every control has a visible label; errors use `role="alert"`; async status uses `aria-live`.
- Focus ring: 2 px pencil outline with offset, never removed.
- Contrast: chalk and chalk-dim on paper meet WCAG AA for body text.
- Keyboard: skip link, Depth Dial arrow keys, native `details` for the decision list.
- Motion: the only ambient animation honours `prefers-reduced-motion`.

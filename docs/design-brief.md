# Design brief

**Owner:** the founder. **Status:** Draft (change to "Ready for the agent" when it is ready).

This is the founder's direction for how SeniorSeat looks and feels. Coding agents read it before any visual work, and it wins over the current look. Where it is silent, the existing design system applies ([design-system.md](design-system.md), [ADR 0009](decisions/0009-design-language.md)). Screenshots of the current look are in [screenshots/](screenshots/).

You don't need to fill in everything. A few honest sentences and two or three reference links per section are enough; delete the prompts in italics as you go.

## 1. The feeling in one sentence

*What should a first-time visitor feel in the first five seconds? For example: "a calm, serious workshop where beginners are taken seriously".*

## 2. Keep or change the current blueprint look

*Look at docs/screenshots. What do you want to keep (the cyanotype blue, the floor plan, the drafting feel)? What do you want to change or drop?*

- Keep:
- Change:
- Drop:

## 3. References

*Sites, apps or printed things you like, and exactly what you like about each: "the reading width on X", "how Y shows progress".*

| Reference (link) | What to take from it |
| --- | --- |
| | |

## 4. Colour and type

*Light, dark or both? Any colours you want or want to avoid? Typefaces you like? If unsure, describe the mood and let the agent propose two options to choose from.*

## 5. Pages, in priority order

*Which pages matter most at launch, and anything specific about each.*

1. Home:
2. Learning path (`/learn`):
3. Tutorial page (`/learn/[slug]`):
4. Prompt X-Ray:
5. Decision Cards:
6. Other:

## 6. The tutorial page

*This is the page learners will spend the most time on. Describe how it should work:*

- Reading width, and code blocks (copy button? line numbers?):
- How depth levels show (tabs, a slider, separate pages?):
- Progress and "mark as done":
- Diagrams, images and video:
- What sits beside the text (table of contents, related cards, nothing?):

## 7. Mobile

*Anything specific about phones? Many learners will read tutorials on a phone.*

## 8. Must not

*Things you never want to see: for example stock photos, emoji in headings, gamified confetti, or dark patterns around the waitlist.*

## 9. Questions for the agent

*Anything you want the agent to propose options for, rather than decide.*

---

**How the agent uses this file:** read it fully, propose a short design plan (palette, type, layout, one memorable element), wait for the founder's approval, then implement it in `src/app/globals.css`, the UI primitives and the pages. Update [design-system.md](design-system.md), and add an ADR if the design language changes. Check every changed page in a browser on desktop and mobile before reporting it done.

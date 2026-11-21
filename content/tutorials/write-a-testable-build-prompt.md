---
slug: write-a-testable-build-prompt
title: Write a build prompt you can test
summary: Specify what should happen in one ordinary case and one empty case, then check both outcomes.
status: draft
version: 1
updatedAt: 2026-11-21
chapter: dream
order: 3
level: technical
domains: [product-scope, planning-specs]
estimatedMinutes: 9
prerequisites: [sketch-the-first-workflow]
relatedCards: [one-job]
---

## Define what counts as done

“Make the list easy to use” leaves Maya and the builder to guess what success looks like. An **acceptance criterion** describes an outcome they can both check. For Maya's first version, an order belongs under the selected day and the correct pickup time.

Write the starting situation, the action and the visible outcome. The words *Given*, *When* and *Then* are a convenient way to separate them. You can use this format with pencil and paper. [Cucumber's guide to examples](https://cucumber.io/docs/gherkin/reference/#example)

## Give the builder a worked example

```text
Build the baker's order entry and daily pickup list. Keep payments at the counter.
Given Jo has two rye loaves for Saturday at 10 and Lee has one loaf for Saturday at 11,
when Maya opens Saturday's list,
then Jo appears under 10 with two rye loaves and Lee appears under 11 with one loaf.
```

Try swapping the pickup times on paper. Your rule should still work. The names and times are example inputs. Ask the builder to group the orders that Maya enters so the app works for the next customer too.

## Describe an empty day

What should Maya see on a day with no orders? A blank screen leaves her guessing whether anything loaded. Make the empty result one of your checks.

```text
Given there are no Sunday orders,
when Maya opens Sunday's pickup list,
then it says “No pickups for Sunday” and shows no Saturday orders.
```

## Prove it with fresh inputs

Run both examples on paper or in your prototype. Then add an order for a different customer at ten on Saturday. Both ten o'clock orders should be visible in that group, and Sunday should still be empty.

For your project, replace the people, action and expected result with your own. Give the checks to someone else. If they can tell whether each example passed without asking what you meant, your build prompt is ready to try.

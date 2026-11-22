---
slug: write-a-testable-build-prompt
title: Write a build prompt you can test
summary: Specify what should happen in one ordinary case and one empty case, then check both outcomes.
status: draft
version: 2
updatedAt: 2026-11-22
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

## Work through Saturday

Put the two slips from the previous lesson on a sheet labelled Saturday. Under 10 am, write “Jo · two rye loaves.” Under 11 am, write “Lee · one oat loaf.” If Lee changed the pickup to 10 am, which group would the order move to? Keep the original times for the first check below.

## Describe an empty day

What should Maya see on a day with no orders? A blank screen leaves her guessing whether anything loaded. Put an empty Sunday sheet beside Saturday's list. Maya should be able to tell which day she's looking at and whether she has anything to pack.

## Assemble the build prompt

Copy the whole block. It gives the builder the job, the boundary and both checks in one place.

```text
Build a daily pickup list for Maya, a baker packing orders.
Let her enter a customer name, bread, quantity, pickup day and time.
Show orders for the selected day grouped by pickup time. Keep payments at the counter.

Given Jo orders two rye loaves for Saturday at 10 am and Lee orders one oat loaf for Saturday at 11 am
When Maya opens Saturday's list
Then the 10 am group shows Jo with two rye loaves and the 11 am group shows Lee with one oat loaf.

Given those Saturday orders exist and there are no Sunday orders
When Maya opens Sunday's list
Then she sees “No pickups for Sunday” and the list is empty.
```

## Prove it with fresh inputs

Run both examples on paper or in your prototype. Then add a Saturday order for Sam, one seed loaf at 10 am. The 10 am group should contain Jo and Sam, the 11 am group should still contain Lee, and Sunday should still be empty.

For your project, replace the people, action and expected result with your own. Give the checks to someone else. If they can tell whether each example passed without asking what you meant, your build prompt is ready to try.

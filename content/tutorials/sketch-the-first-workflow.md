---
slug: sketch-the-first-workflow
title: Sketch the smallest useful workflow
summary: Draw a beginning, an action and an observable finish. Decide which requests can wait.
status: draft
version: 1
updatedAt: 2026-11-21
chapter: dream
order: 2
level: practical
domains: [product-scope, planning-specs]
estimatedMinutes: 7
prerequisites: [choose-one-job]
relatedCards: [one-job]
---

## Walk one order through the bakery

Start with Maya's job sentence. On paper, write a sample order on a slip. Jo wants two rye loaves on Saturday at ten. Another customer, Lee, will pick up one loaf at eleven.

A workflow is the set of actions that gets someone from their starting situation to a useful result. Give Maya both slips. If you only draw a form, she can enter every order and still have to make her packing list by hand.

## Draw the beginning, action and finish

1. **Beginning.** Maya has an order with a name, an item, a quantity and a pickup time.
2. **Action.** Maya adds the order and opens the pickup list for Saturday.
3. **Finish.** She can point to the ten o'clock group and say which bread belongs to Jo.

Now draw the same three moments for your project. Write one sentence per moment. Circle the last thing the person needs to see or hold. Work backwards and cross out anything you could remove while still reaching that finish.

## Give the first version a boundary

Online payments could help Maya later. Taking a payment does nothing to group today's slips by pickup time. For this first version, Maya can keep taking payment at the counter.

Write down what you are keeping and one thing you are setting aside. Here is the instruction Maya can give her builder.

```text
Build a way for the baker to enter an order and see a day's pickup list grouped by time.
Keep payment at the counter for this version.
```

## Prove it on paper

Hand someone the slips and your sketch. Ask them to find Jo's collection without explaining the drawing. If they need you to fill in a missing step, add it. If they can tell who collects what and when, you have a workflow worth testing in software.

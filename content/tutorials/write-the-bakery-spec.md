---
slug: write-the-bakery-spec
title: Write the order model and access rules into a spec
summary: Turn the bakery slips and permissions into a copyable SPEC.md, then use it to check what an AI builder proposes.
status: draft
version: 1
updatedAt: 2026-11-23
chapter: blueprint
order: 3
level: technical
domains: [planning-specs, data, identity-access]
estimatedMinutes: 9
prerequisites: [sketch-order-permissions]
relatedCards: [keep-a-build-spec, where-data-lives, who-sees-what]
---

## Give an order an identity

Suppose another customer named Jo places an order. A name works on a bread bag. It can't tell the app which Jo signed in. Give each customer account a stable ID and each order its own ID. Keep a separate name to print on the packing list. The two Jo accounts can then share a display name without sharing any orders.

A **data model** describes the records you keep and how they relate. Here, each order belongs to a customer account. In a relational database a *foreign key* can require that the referenced account exists. The app still needs a rule for who may read that customer's order. [PostgreSQL guide to constraints](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK)

## Put the baker's decisions in SPEC.md

Create a plain text file named `SPEC.md` in your practice project. Copy this starting spec. It covers the version where customers can check their pickups online.

```text
# Bakery pickups

Store orders in the app's database. The baker enters one bread type per order.
Each order has a unique order ID and belongs to one existing customer account ID.
Require a packing name, bread, positive whole quantity, pickup date and local bakery time.
Build the daily packing list from the saved orders, grouped by pickup time.

The signed-in baker can create orders, read the whole packing list and correct pickup times.
A signed-in customer can read only orders belonging to their account. Customers cannot change orders.
Visitors can read opening hours. Order access is denied unless a rule above grants it.
Enforce access on the server for every order read or change. Keep payments at the counter.

Given Jo has two rye loaves at 10 am and Lee has one oat loaf at 11 am on Saturday,
when Maya moves Jo to 11, both orders appear in her 11 am group and neither appears at 10.
Jo sees the new time for her order. Lee sees only his oat order. A visitor sees neither.
On Sunday, with no orders, Maya sees “No pickups for Sunday”.
```

## Give the builder a starting instruction

Copy the bakery build prompt from the last Dream lesson. [Write a build prompt you can test](/learn/write-a-testable-build-prompt#lesson-assemble-the-build-prompt)

Paste it into the Prompt X-Ray and run the check. Choose **Download AGENTS.md starter** under **Your prompt, with the decisions added**. [Open the Prompt X-Ray](/xray)

Read the starter alongside your spec. Resolve any suggested choices that conflict with the bakery rules. For example, an instruction allowing customers to edit their own orders would undo Maya's pickup policy. Add the line below to the starter in your practice project. If you already keep an `AGENTS.md` there, bring the relevant instructions into that file.

```text
Read SPEC.md before editing. For each change to orders, name the rule it implements and show how you checked it.
```

## Prove it with two customers named Jo

Give the files to a reader or your builder. On paper, give the second Jo a different account ID and a seed loaf for Saturday at 10 am. Ask which orders each Jo sees and what Maya packs at each time after the original Jo moves to 11.

Pass when the second Jo sees only the seed loaf, the original Jo sees only her rye order, and Maya sees the seed loaf at 10 and the rye and oat orders at 11. Ask whether a customer can move any of those orders. The reader should be able to point to the rule reserving that change for Maya. Keep this case beside the spec for the first build.

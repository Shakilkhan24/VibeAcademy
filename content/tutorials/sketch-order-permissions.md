---
slug: sketch-order-permissions
title: Sketch who can see and change an order
summary: Give Maya, her customers and a signed-out visitor a paper view of the same bakery, then check who can move a pickup.
status: draft
version: 1
updatedAt: 2026-11-23
chapter: blueprint
order: 2
level: practical
domains: [identity-access]
estimatedMinutes: 6
prerequisites: [choose-an-order-book]
relatedCards: [who-sees-what]
---

## Hand each person their part of the list

Maya is trying the customer view she imagined in the last lesson. Jo wants to check when to collect her rye loaves. Lee wants to do the same for his oat loaf. Maya needs both orders to pack Saturday's bread. Someone walking past the shop window only needs the opening hours.

Make paper slips for the original Saturday orders, Jo at 10 am and Lee at 11 am. Lay out a place for each customer, one for Maya and one for a visitor. Deal a copy of each slip to whoever should see it. Maya gets both. Each signed-in customer gets their own. The visitor's place stays clear of orders.

## Decide who may hold the pencil

Jo calls to ask for a later pickup. Maya checks the baking schedule before she agrees. If Jo could change the time herself, Maya might promise a loaf that is still in the oven. This is a business decision you can write down before choosing a sign-in tool.

- **Baker.** Maya can enter an order for a customer, read the packing list and correct a pickup time.
- **Customer.** A signed-in customer may read their own orders. They call Maya for changes.
- **Visitor.** Anyone can read the opening hours. A signed-out visitor has no access to orders.

For your project, write down a person, an action and which records it applies to. Read the rule aloud with two different customers' names. “A customer may view an order” leaves out whose order it is. Ask the builder to enforce each rule where the app serves or changes the record. [OWASP guidance on checking permissions](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html#validate-the-permissions-on-every-request)

## Prove it by swapping roles

Ask someone to play Jo. Can they read her 10 am pickup? Can they tell what Lee ordered? Jo should be able to answer only the first question. Hand them the visitor role and take away both order slips. They can still look up when the bakery opens.

Now let Jo ask for 11 am. The order should stay at 10 until Maya makes the change. After Maya changes it, Jo and Maya should both see the new time, and Lee's order should read exactly as before. If a rule on your page cannot settle one of those questions, change its wording and deal the slips again.

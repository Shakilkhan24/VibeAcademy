---
slug: choose-an-order-book
title: Choose where the bakery keeps its orders
summary: Follow a changed pickup time from the counter to the packing list and decide where Maya should look for the latest order.
status: draft
version: 1
updatedAt: 2026-11-23
chapter: blueprint
order: 1
level: story
domains: [data]
estimatedMinutes: 5
prerequisites: [write-a-testable-build-prompt]
relatedCards: [where-data-lives]
---

## Find the order that changed

On Friday, Maya writes “Jo, two rye loaves, Saturday at 10 am” on a slip. Lee wants one oat loaf at 11 am. Maya copies both onto her packing list. Then Jo calls back. Could she come at 11 instead? Maya changes the slip. On Saturday she still has the old list by the oven. Which time should she trust?

Pick one place where a correction counts. Maya can make a fresh packing list from it whenever she starts a batch. Try the two options below with the same slips.

## Give Maya a book she can keep herself

Draw a sheet with a column for each thing Maya needs at the oven. Label them customer, bread, quantity, pickup day and pickup time. Give each order its own row. Jo's change takes one edit. When Maya needs the list, she reads Saturday's rows in time order.

A private spreadsheet suits this bakery while Maya takes every call and enters every change herself. She can try it today. She also owns the Friday evening job of checking that every slip made it into the sheet. Keep the sheet in a place only the people packing orders can open. For example, a Google Drive file can inherit access from its folder. [Drive file sharing](https://support.google.com/drive/answer/2494822?hl=en)

## Choose what would make you switch

Suppose Jo now wants to sign in from home to see her own pickup time. Giving her the packing sheet would show Lee's order too. For that version, Maya chooses a database behind the app. Both the customer's order view and Maya's packing list will read from the same saved order. Someone has to build those views and decide who may open each one.

Write a sentence for your project. Maya's reads, “For the counter trial I keep orders in my private sheet. When customers need their own view, the app will keep the orders in a database.” Name the person who will move the records and decide when to stop editing the old book.

## Prove it with a late pickup

Enter the original slips in your chosen book, move Jo to 11 am, then close it. Reopen it as the baker and make Saturday's list again. The 10 am group should be empty. At 11 am you should pack two rye loaves for Jo and one oat loaf for Lee. If you had to remember Jo's call to get that answer, find where the old time survived.

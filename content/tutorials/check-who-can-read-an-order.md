---
slug: check-who-can-read-an-order
title: Check who can read an order
summary: Run the same order query as Jo and Lee and see the database return a different pickup slip to each customer.
status: reviewed
version: 1
updatedAt: 2026-11-23
chapter: first-build
order: 2
level: technical
domains: [identity-access, data]
estimatedMinutes: 9
prerequisites: [keep-the-bakery-key-on-the-server]
relatedCards: [who-sees-what]
---

## Turn the slips into a database check

Jo is collecting rye and Lee is collecting oat. Both use the same “My orders” page. The bakery spec says Jo can read her own order, and Maya needs the whole list for packing. A page that simply hides Lee’s slip after downloading both orders would still deliver Lee’s details to Jo.

Write an ownership rule at the point that serves the data. In this exercise PostgreSQL applies a read policy to each row and grants the two customer roles read access only. The role names stand in for verified account identities. In an app with a shared database login, use the trusted identity from the signed-in session to identify the customer. Checked 23 November 2026. [PostgreSQL row security](https://www.postgresql.org/docs/17/ddl-rowsecurity.html)

## Read the same list twice

Run the block in one session in a fresh practice PostgreSQL database, using a setup user allowed to create roles and switch to them. The tables and roles are part of a transaction that rolls back at the end. Read the results of the two queries before closing the session.

```sql
BEGIN;
CREATE ROLE bakery_jo;
CREATE ROLE bakery_lee;
CREATE SCHEMA pickup_lesson;
CREATE TABLE pickup_lesson.orders (
  slip text PRIMARY KEY,
  customer_role name NOT NULL,
  bread text NOT NULL
);
INSERT INTO pickup_lesson.orders VALUES
  ('rye-slip', 'bakery_jo', 'rye'),
  ('oat-slip', 'bakery_lee', 'oat');

ALTER TABLE pickup_lesson.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY read_own_pickups ON pickup_lesson.orders FOR SELECT
  USING (customer_role = current_user);
GRANT USAGE ON SCHEMA pickup_lesson TO bakery_jo, bakery_lee;
GRANT SELECT ON pickup_lesson.orders TO bakery_jo, bakery_lee;

SET LOCAL ROLE bakery_jo;
SELECT current_user, slip, bread FROM pickup_lesson.orders;
RESET ROLE;
SET LOCAL ROLE bakery_lee;
SELECT current_user, slip, bread FROM pickup_lesson.orders;
ROLLBACK;
```

Jo should get one row, `rye-slip`. Lee should get one row, `oat-slip`. Both queries ask for all visible orders. If either returns an empty list, an owner lost access. If either returns two slips, the two accounts can see each other’s order. Running both queries as the table owner would miss the point, since the owner normally bypasses row security.

## Prove it through your own order reader

Seed your practice app with those two fictional orders. In separate customer sessions, run your order reader’s integration test against the normal data source. Assert that the returned set of order IDs is exactly Jo’s rye slip for Jo and exactly Lee’s oat slip for Lee. Check the returned records before the UI renders them.

Then sign out and check that the reader returns no private order data. As Maya, open Saturday’s packing list and check that both slips are present. Keep all four expectations in the same test fixture. The baker should still be able to pack both orders after the customers’ views are private.

---
slug: confirm-payment-before-packing
title: Confirm a payment before packing the order
summary: Trace a prepaid pickup from checkout to the packing list, including a late confirmation and a repeated notification.
status: draft
version: 1
updatedAt: 2026-11-23
chapter: first-build
order: 3
level: technical
domains: [cost-business, data]
estimatedMinutes: 8
prerequisites: [check-who-can-read-an-order]
relatedCards: [confirm-a-payment, where-secrets-live]
---

## Give the return page one job

In the Blueprint exercise, Jo paid at the counter. Now suppose Maya wants to try prepayment for special orders. When Jo places a rye order, the bakery server saves its expected total and currency, creates a hosted checkout and records that checkout’s ID on the pending order. The ID lets Maya match a provider receipt to the right bag even when two customers have the same name.

Jo might pay and close the tab on the walk home. She might also return to the bakery site while the bank is still processing the payment. Let the return page read the order status from the bakery server. It can display “Waiting for payment confirmation” until the server has the receipt.

## Decide what counts as a receipt

A webhook is a notification the provider sends to your server. For a Stripe Checkout example, the server uses Stripe’s library, the unmodified request body, the signature header and its endpoint signing secret to verify the delivery. Ignore an unverified message. Checked 23 November 2026. [Stripe webhook verification](https://docs.stripe.com/webhooks#verify-webhook-signatures)

For Maya’s prepaid loaves, the server retrieves the Checkout Session and requires a paid status plus a matching checkout ID, total and currency for the saved order. A completed checkout using a delayed payment method may still be unpaid. Leave it pending until the provider confirms success. A failed payment never earns a paid slip. Checked 23 November 2026. [Stripe Checkout fulfillment](https://docs.stripe.com/checkout/fulfillment)

## Make a repeat delivery harmless

Two deliveries can both reach the bakery before either finishes processing. In one database transaction, change the matching order from pending to paid only if it is still pending. Only the operation that makes that change may insert the packing job, with a unique key for the order. Commit both together. A worker that retries the packing job should use that same key to avoid issuing another slip.

Write this case into the spec. “If a paid order already has its packing job, another confirmation leaves one paid order and one job.” This property is called **idempotency**.

## Prove it with a late receipt

Start with two fictional orders in a local test fixture, one for rye and one for oat. Check each change in the order record and packing queue.

1. Jo opens the return page for the rye order before confirmation. The order stays pending and the packing queue is empty.
2. A verified notification identifies the rye checkout, but the payment is still processing. The queue stays empty. A notification with a mismatched total or currency also leaves the order alone.
3. Jo closes the tab. The provider confirms the expected payment on the server. The rye order changes to paid and one packing job appears.
4. Deliver the same confirmation twice, including two deliveries at the same time. There is still one job for rye. Let the oat payment fail. It stays unpaid and gets no job.

Run the cases with a test double for the provider. When you wire up a real checkout, repeat the successful and repeated deliveries in the provider’s sandbox, and include a signature-verification failure in your handler tests. Maya should be able to decide what to pack from the saved orders even if neither customer returns to the site.

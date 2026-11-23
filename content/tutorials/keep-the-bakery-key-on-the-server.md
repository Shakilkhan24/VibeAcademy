---
slug: keep-the-bakery-key-on-the-server
title: Keep the bakery’s private key on the server
summary: Use two harmless labels in a practice build to see which settings reach a customer’s browser.
status: reviewed
version: 1
updatedAt: 2026-11-23
chapter: first-build
order: 1
level: practical
domains: [security-secrets]
estimatedMinutes: 7
prerequisites: [write-the-bakery-spec]
relatedCards: [where-secrets-live]
---

## Follow Jo’s pickup reminder

Jo asks Maya to email her when the rye loaves are packed. Maya’s “Send reminder” button needs to tell the bakery server which order is ready. The server checks that Maya is signed in as the baker, looks up the order and calls the email service using the bakery’s private sending key. Jo’s browser can display the pickup time without ever receiving that key.

In your build spec, name the service, who may trigger the action and which part of the app reads the credential. For this bakery, the email service key belongs in a server-only setting. The response can say “Reminder queued.” Sending the whole settings object back to the page would expose its contents.

## Label the practice build

Use a preview of your own project and a fake email sender. Set the sender’s usual private setting to the harmless text `bakery-private-rehearsal`. Have the fake sender check it on the server and return only a success or failure. Give this same preview a visible build label, `bakery-public-rehearsal`, in a client component. When testing your project, choose fresh labels so tutorial text cannot produce a match.

In Next.js, direct references to `NEXT_PUBLIC_` variables can be replaced with their values in browser JavaScript at build time. Keep the sending key in a server-only module and build the preview after setting both labels. Checked 23 November 2026. [Next.js environment variables](https://nextjs.org/docs/app/guides/environment-variables#bundling-environment-variables-for-the-browser)

## Prove it on your deployed preview

Open the preview, send a reminder through the fake sender and check that the server reports success. In your browser’s developer tools, search the loaded sources for your visible label. Then search for the private label. Inspect the page document and the reminder request and response as well. A public match confirms you loaded the intended build.

For a Next.js preview, also search its matching build artifact. From the project directory, use these commands with your own rehearsal labels. They print matching filenames.

```sh
rg --no-ignore --fixed-strings --files-with-matches 'bakery-public-rehearsal' .next/static
rg --no-ignore --fixed-strings --files-with-matches 'bakery-private-rehearsal' .next/static
```

Pass when the public label appears in a browser asset, the fake sender accepted the private value, and the private label is absent from the checked assets and browser traffic. If the public label is missing or the build directory cannot be read, fix the check and repeat it. Remove the rehearsal labels when you finish.

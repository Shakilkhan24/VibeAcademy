import type { Metadata } from "next";
import { Container, PageIntro } from "@/components/layout/page-intro";

export const metadata: Metadata = { title: "Privacy", description: "What VibeAcademy stores, what it never stores, and how to delete it." };

/**
 * Plain-language privacy summary of what the code actually does. Keep it in sync with
 * docs/privacy.md. The launch policy text is tracked in issue #8.
 */
export default function PrivacyPage() {
  return (
    <Container>
      <PageIntro title="What we keep, and what we never keep">
        Prompts often describe a business idea. We built the X-Ray so your idea does not end up in our database.
      </PageIntro>

      <div className="grid max-w-4xl gap-10 text-measure">
        <section>
          <h2 className="text-h2">Your prompt</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-chalk-dim">
            <li>We never store your prompt, log it or use it to train any model.</li>
            <li>Today the X-Ray is a rule-based check that runs on our server, so your prompt is not sent to any AI provider. If we switch on AI-assisted analysis later, we will update this page before we do.</li>
            <li>We keep a keyed fingerprint (an HMAC) of the prompt, so an identical prompt can reuse its earlier analysis. The fingerprint cannot be turned back into the text.</li>
            <li>The upgraded prompt is assembled in your browser. Our server never sends your words back.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-h2">Your X-Ray result</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-chalk-dim">
            <li>We store the score, which decisions were made, the kind of app and the coverage per domain, to improve VibeAcademy.</li>
            <li>Sharing is off until you create a share link. A shared page shows the score, coverage and top risks only.</li>
            <li>You can stop sharing or delete the result from the result page at any time.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-h2">Your learning progress</h2>
          <p className="mt-4 text-chalk-dim">This browser remembers which tutorials you mark as done. You can mark a lesson as incomplete or clear the stored data for this site to remove your progress.</p>
          <p className="mt-3 text-chalk-dim">Marking a lesson done also sends its short name and version so we can count completions. An optional Yes or Not yet response tells us whether the lesson helped. Your written comment stays private to the team. The public numbers appear after a lesson receives ten responses.</p>
        </section>
        <section>
          <h2 className="text-h2">Your visit and your email</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-chalk-dim">
            <li>Your IP address is turned into a keyed fingerprint to enforce fair-use limits. We do not store the address itself.</li>
            <li>No advertising or third-party tracking cookies. Product analytics are counted in our own database, without personal data.</li>
            <li>If you join the waitlist, we store your email and the answers you chose so we can tell you when VibeAcademy opens.</li>
            <li>To leave the waitlist, email <a className="underline" href="mailto:automateanything2@gmail.com">automateanything2@gmail.com</a> from the address you used to sign up. We’ll confirm you control that address and remove the signup.</li>
          </ul>
        </section>
      </div>
    </Container>
  );
}

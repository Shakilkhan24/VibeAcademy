import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Container, PageIntro } from "@/components/layout/page-intro";
import { SignInWithGoogle } from "@/components/account/sign-in-button";
import { Notice } from "@/components/ui/notice";
import { getLearner } from "@/server/auth";
import { getAppContext } from "@/server/context";

export const metadata: Metadata = { title: "Sign in", description: "Sign in with Google to keep your lessons and projects on every device.", robots: { index: false } };

export default async function SignInPage() {
  const requestHeaders = await headers(); // first: marks the page dynamic before any server work
  const ctx = await getAppContext();
  if (await getLearner(ctx.auth, requestHeaders)) redirect("/account");

  return (
    <Container>
      <PageIntro title="Keep your progress on every device">
        Sign in to save the lessons you finish and the decisions you make for each app you build. Everything else on VibeAcademy works without an account.
      </PageIntro>
      <div className="max-w-xl pb-20">
        {ctx.config.auth.google ? (
          <>
            <SignInWithGoogle callbackURL="/account" />
            <p className="mt-6 text-small text-chalk-dim">
              We receive your name, email address and profile picture from Google. We do not post anything or read your Google data. See{" "}
              <a href="/privacy">what we keep</a>.
            </p>
          </>
        ) : (
          <Notice tone="info" title="Sign-in is not set up on this server">
            The lessons, Decision Cards and Prompt X-Ray work without an account. Your progress is saved in this browser.
          </Notice>
        )}
      </div>
    </Container>
  );
}

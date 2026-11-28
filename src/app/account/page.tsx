import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Container, PageIntro } from "@/components/layout/page-intro";
import { SignOutButton } from "@/components/account/sign-in-button";
import { getLearner } from "@/server/auth";
import { getAppContext } from "@/server/context";
import { getAccount } from "@/server/services/account";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };

export default async function AccountPage() {
  const requestHeaders = await headers(); // first: marks the page dynamic before any server work
  const ctx = await getAppContext();
  const learner = await getLearner(ctx.auth, requestHeaders);
  if (!learner) redirect("/sign-in");
  const account = await getAccount(ctx, learner);

  return (
    <Container>
      <PageIntro title={`Signed in as ${account.name}`}>
        Your lesson progress and projects are saved to this account.
      </PageIntro>
      <dl className="grid max-w-xl gap-4 pb-8 text-small sm:grid-cols-[10rem_1fr]">
        <dt className="text-chalk-dim">Name</dt>
        <dd>{account.name}</dd>
        <dt className="text-chalk-dim">Email</dt>
        <dd>{account.email}</dd>
        <dt className="text-chalk-dim">Signed in with</dt>
        <dd>Google</dd>
        <dt className="text-chalk-dim">Member since</dt>
        <dd>{new Date(account.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</dd>
      </dl>
      <div className="pb-20">
        <SignOutButton />
      </div>
    </Container>
  );
}

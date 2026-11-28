"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";

/** Header links for the visitor's session. Renders nothing until the session is known. */
export function AccountMenu() {
  const { data, isPending } = authClient.useSession();
  if (isPending) return <span className="text-small text-chalk-dim" aria-hidden="true" />;
  if (!data) {
    return (
      <Link href="/sign-in" className="text-small text-chalk-dim hover:text-chalk">
        Sign in
      </Link>
    );
  }
  return (
    <Link href="/account" className="text-small text-chalk-dim hover:text-chalk">
      Your account
    </Link>
  );
}

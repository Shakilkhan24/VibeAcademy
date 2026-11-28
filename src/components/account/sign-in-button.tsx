"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SignInWithGoogle({ callbackURL }: { callbackURL: string }) {
  const [state, setState] = useState<"idle" | "busy" | "failed">("idle");
  return (
    <div>
      <Button
        disabled={state === "busy"}
        onClick={async () => {
          setState("busy");
          const { error } = await authClient.signIn.social({ provider: "google", callbackURL });
          if (error) setState("failed");
        }}
      >
        {state === "busy" ? "Opening Google…" : "Continue with Google"}
      </Button>
      {state === "failed" ? (
        <p role="alert" className="mt-3 text-small text-redline">Google sign-in did not start. Check your connection and try again.</p>
      ) : null}
    </div>
  );
}

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="secondary"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await authClient.signOut();
        router.push("/");
        router.refresh();
      }}
    >
      {busy ? "Signing out…" : "Sign out"}
    </Button>
  );
}

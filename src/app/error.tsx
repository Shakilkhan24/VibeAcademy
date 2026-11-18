"use client";

import { Container, PageIntro } from "@/components/layout/page-intro";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Container>
      <PageIntro title="Something broke on our side">
        The page could not load. Try again; if it keeps happening, the problem is ours, not yours.
      </PageIntro>
      <Button type="button" onClick={reset}>Try again</Button>
    </Container>
  );
}

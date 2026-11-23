import type { Metadata } from "next";
import { Container, PageIntro } from "@/components/layout/page-intro";
import { WaitlistForm } from "@/components/waitlist/waitlist-form";

export const metadata: Metadata = {
  title: "Join the waitlist",
  description: "Be first in when VibeAcademy's learning path, Blueprints and Build Packs open.",
};

type Props = { searchParams: Promise<{ source?: string }> };

export default async function WaitlistPage({ searchParams }: Props) {
  const { source } = await searchParams;
  return (
    <Container>
      <PageIntro title="Get in first">
        The Prompt X-Ray is open now. Next come the full App Life Path, your project Blueprint and Build Packs for your AI tool. We will email you
        once, when they open.
      </PageIntro>
      <WaitlistForm source={source ?? "waitlist-page"} />
    </Container>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageIntro } from "@/components/layout/page-intro";

export const metadata: Metadata = { title: "Terms of use" };

export default function TermsPage() {
  return (
    <Container>
      <PageIntro title="Terms of use">
        VibeAcademy’s terms for public launch are pending review.
      </PageIntro>
      <Link href="/privacy" className="underline">Read the privacy summary</Link>
    </Container>
  );
}

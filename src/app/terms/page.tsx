import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageIntro } from "@/components/layout/page-intro";

export const metadata: Metadata = { title: "Terms of use" };

export default function TermsPage() {
  return (
    <Container>
      <PageIntro title="Terms of use">
        VibeAcademy’s terms will be published here before public launch.
      </PageIntro>
      <Link href="/privacy" className="underline">Read the privacy summary</Link>
    </Container>
  );
}

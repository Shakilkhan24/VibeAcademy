import type { Metadata } from "next";
import { Container, PageIntro } from "@/components/layout/page-intro";
import { XRayWorkbench } from "@/components/xray/xray-workbench";
import { DECISIONS } from "@/domain/taxonomy";

export const metadata: Metadata = {
  title: "Prompt X-Ray",
  description: "See which engineering decisions your prompt leaves to the AI, which will hurt first, and how to make them.",
};

export default function XRayPage() {
  return (
    <Container>
      <PageIntro title="Prompt X-Ray">
        Paste the prompt you would give Lovable, Bolt, Cursor or any AI builder. The X-Ray checks it against {DECISIONS.length} engineering decisions and shows
        which ones you left to the AI.
      </PageIntro>
      <XRayWorkbench />
    </Container>
  );
}

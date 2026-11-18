import { Container, PageIntro } from "@/components/layout/page-intro";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Container>
      <PageIntro title="This page is not on the plan">
        The link may be old, or a shared X-Ray may have been deleted or unshared by its owner.
      </PageIntro>
      <ButtonLink href="/xray">Run a Prompt X-Ray</ButtonLink>
    </Container>
  );
}

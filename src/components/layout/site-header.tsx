import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Wordmark } from "./wordmark";

const NAV = [
  { href: "/learn", label: "Learning path" },
  { href: "/xray", label: "Prompt X-Ray" },
  { href: "/cards", label: "Decision Cards" },
  { href: "/lab", label: "Twin Builds Lab" },
  { href: "/open", label: "Open numbers" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4 sm:gap-x-8 sm:px-8">
        <Link href="/" className="text-chalk no-underline" aria-label="VibeAcademy home">
          <Wordmark />
        </Link>
        <nav aria-label="Main" className="order-3 w-full sm:order-none sm:w-auto">
          <ul className="flex flex-wrap gap-x-6 gap-y-1 text-small">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-chalk-dim no-underline hover:text-chalk">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto">
          <ButtonLink href="/waitlist" variant="secondary">
            Join the waitlist
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}

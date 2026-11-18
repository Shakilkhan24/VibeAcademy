import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "quiet";

const base =
  "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55 select-none";

const variants: Record<Variant, string> = {
  // Pencil: the one strong colour, reserved for the main action on a screen.
  primary: "bg-pencil text-pencil-ink hover:bg-[#f6cf6d] px-5 py-2.5 text-small",
  secondary: "border border-line-strong text-chalk hover:border-chalk hover:bg-paper-raised px-4 py-2 text-small",
  quiet: "text-chalk-dim hover:text-chalk underline underline-offset-4 decoration-line-strong hover:decoration-chalk px-1 py-1 text-small",
};

export function buttonClass(variant: Variant = "primary", className?: string) {
  return cn(base, variants[variant], className);
}

export function Button({ variant = "primary", className, ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={buttonClass(variant, className)} {...props} />;
}

export function ButtonLink({
  href,
  variant = "primary",
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass(variant, className)}>
      {children}
    </Link>
  );
}

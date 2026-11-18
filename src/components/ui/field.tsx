import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

const control =
  "w-full border border-line-strong bg-paper-deep px-3 py-2.5 text-chalk placeholder:text-chalk-dim/70 transition-colors hover:border-chalk-dim focus:border-pencil focus:outline-none";

export function Label({ htmlFor, children, hint }: { htmlFor: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-small font-medium text-chalk">
      {children}
      {hint ? <span className="ml-2 font-normal text-chalk-dim">{hint}</span> : null}
    </label>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(control, "text-body", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(control, "resize-y font-mono text-small leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn(control, "text-body appearance-none bg-[length:12px] bg-[right_0.9rem_center] bg-no-repeat pr-9", className)} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%23a7bcd1' stroke-width='1.5'/%3E%3C/svg%3E\")" }} {...props}>
      {children}
    </select>
  );
}

export function Checkbox({ id, children, ...props }: ComponentProps<"input"> & { id: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <input id={id} type="checkbox" className="mt-1 size-4 shrink-0 accent-[#f2c14e]" {...props} />
      <label htmlFor={id} className="text-small text-chalk-dim">
        {children}
      </label>
    </div>
  );
}

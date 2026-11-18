import type { ReactNode } from "react";

/** Standard page opening: a headline that states the point, and one paragraph. */
export function PageIntro({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <div className="pt-14 pb-10 sm:pt-20">
      <h1 className="max-w-[18ch] text-h1">{title}</h1>
      {children ? <div className="mt-5 max-w-[60ch] text-body text-chalk-dim">{children}</div> : null}
    </div>
  );
}

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-[1200px] px-5 sm:px-8 ${className}`}>{children}</div>;
}

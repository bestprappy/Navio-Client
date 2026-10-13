import type { ReactNode } from "react";

/** Empty feed or missing page: a short route line, what happened, and what to do next. */
export function EmptyFeed({ title, body, actions }: { title: string; body: string; actions: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/60 px-6 py-12 text-center">
      <svg aria-hidden="true" viewBox="0 0 120 60" className="h-14 w-28 text-primary/50">
        <path d="M4 52 C 26 52, 30 20, 52 22 S 84 46, 116 10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="5 6" strokeLinecap="round" />
        <circle cx="4" cy="52" r="4" className="fill-vote-up" />
        <circle cx="116" cy="10" r="4" className="fill-primary" />
      </svg>
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <p className="max-w-sm text-sm leading-6 text-muted-foreground">{body}</p>
      <div className="mt-1 flex flex-wrap justify-center gap-2">{actions}</div>
    </div>
  );
}

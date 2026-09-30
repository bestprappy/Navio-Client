import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { formatCount } from "./admin-format";

/**
 * A single divided strip of counts. Link only when the API supports a
 * matching list; summaries without matching filters remain noninteractive.
 * Deliberately one surface rather than a row of look-alike cards: the numbers
 * are one reading of the same population.
 */
function Root({ label, children }: { label: string; children: ReactNode }) {
  return (
    <ul
      aria-label={label}
      className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-4"
    >
      {children}
    </ul>
  );
}

type ItemProps = {
  href?: string;
  value: number;
  label: string;
  /** Adds meaning beyond the number, e.g. what "active" means here. */
  hint?: string;
  tone?: "default" | "destructive";
};

function Item({ href, value, label, hint, tone = "default" }: ItemProps) {
  const content = (
    <>
      <span className={cn("text-3xl font-semibold tabular-nums leading-none", tone === "destructive" && value > 0 ? "text-destructive" : "text-foreground")}>
        {formatCount(value)}
      </span>
      <span className="text-sm font-medium text-foreground">{label}</span>
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </>
  );
  return (
    <li className="bg-card">
      {href ? <Link
        href={href}
        className="group flex h-full flex-col gap-1 px-5 py-4 outline-none transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        {content}
      </Link> : <div className="flex h-full flex-col gap-1 px-5 py-4">{content}</div>}
    </li>
  );
}

export const AccountCountStrip = { Root, Item };

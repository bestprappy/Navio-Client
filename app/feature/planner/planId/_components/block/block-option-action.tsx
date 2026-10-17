"use client";

import { type ReactNode, useId } from "react";

import { cn } from "@/lib/utils";

type BlockOptionActionProps = {
  icon: ReactNode;
  title: string;
  hint: string;
  emphasis: "primary" | "strong" | "neutral";
  disabled?: boolean;
  onClick: () => void;
};

/** One action row in Block options: icon, title and a one-line hint describing the result. */
export function BlockOptionAction({ icon, title, hint, emphasis, disabled = false, onClick }: BlockOptionActionProps) {
  const titleId = useId();
  const hintId = useId();
  return (
    <button
      type="button"
      aria-labelledby={titleId}
      aria-describedby={hintId}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset disabled:pointer-events-none disabled:opacity-50",
        emphasis === "strong" && "bg-primary text-primary-foreground hover:bg-primary/90",
        emphasis === "primary" && "bg-primary/10 text-primary hover:bg-primary/15",
        emphasis === "neutral" && "text-foreground hover:bg-muted",
      )}
    >
      <span className="mt-0.5 shrink-0 [&_svg]:size-4" aria-hidden="true">{icon}</span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span id={titleId} className="text-sm font-semibold leading-tight">{title}</span>
        <span
          id={hintId}
          className={cn(
            "text-xs leading-snug",
            emphasis === "strong" ? "text-primary-foreground/85" : "text-muted-foreground",
          )}
        >
          {hint}
        </span>
      </span>
    </button>
  );
}

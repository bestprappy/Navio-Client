"use client";

import { Plus } from "lucide-react";

type InlineAddDividerProps = {
  onClick: () => void;
  label?: string;
};

export function InlineAddDivider({
  onClick,
  label = "Add",
}: InlineAddDividerProps) {
  return (
    <div className="group relative flex cursor-pointer items-center ">
      <div className="h-px flex-1 bg-border/50 opacity-0 transition-opacity group-hover:opacity-100" />

      <button
        type="button"
        aria-label={label}
        title={label}
        className="relative mx-2 flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground opacity-0 shadow-sm transition-all group-hover:opacity-100 hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <Plus className="size-3.5" aria-hidden="true" />
      </button>

      <div className="h-px flex-1 bg-border/50 opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}

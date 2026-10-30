"use client";

import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type ViewSwitchOption<View extends string> = { id: View; label: string; Icon: LucideIcon };

type ViewSwitchProps<View extends string> = {
  /** Names the group for assistive technology, such as "Itinerary view". */
  label: string;
  views: readonly ViewSwitchOption<View>[];
  value: View;
  onChange: (view: View) => void;
  className?: string;
};

/** Tab-like buttons that switch one section between views. */
export function ViewSwitch<View extends string>({ label, views, value, onChange, className }: ViewSwitchProps<View>) {
  return (
    <div role="group" aria-label={label} className={cn("flex items-end gap-1", className)}>
      {views.map(({ id, label: viewLabel, Icon }) => {
        const isCurrent = value === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={isCurrent}
            onClick={() => onChange(id)}
            className={cn(
              "relative flex min-h-10 items-center gap-1.5 rounded-md px-3 text-sm transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              // The underline marks the open view, like a tab, without relying on colour alone.
              "after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full",
              isCurrent
                ? "font-semibold text-foreground after:bg-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground after:bg-transparent",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {viewLabel}
          </button>
        );
      })}
    </div>
  );
}

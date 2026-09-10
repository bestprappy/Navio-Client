import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ReadOnlyFieldProps = {
  label: string;
  /** Rendered inside the field shell. Falls back to a dash when empty. */
  value: ReactNode;
  hint?: string;
  className?: string;
};

/**
 * A field that looks like the editable inputs beside it but carries a value
 * Navio does not let the user change here. It is deliberately not a disabled
 * `input`: there is nothing to submit, and a real value is easier to read and
 * copy than a greyed-out control.
 */
export function ReadOnlyField({ label, value, hint, className }: ReadOnlyFieldProps) {
  const isEmpty = value === null || value === undefined || value === "";

  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <span className="text-sm font-medium text-foreground">{label}</span>
      <p
        className={cn(
          "flex h-11 min-w-0 items-center truncate rounded-[var(--btn-radius)] border border-border bg-muted/40 px-3 text-sm",
          isEmpty ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {isEmpty ? "Not set" : value}
      </p>
      {hint ? <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

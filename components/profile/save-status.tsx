"use client";

import { Check, CircleAlert, CircleDashed, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProfileSaveStatus } from "@/types/profile";

export function SaveStatus({ status, onRetry }: { status: ProfileSaveStatus; onRetry: () => void }) {
  const Icon = status === "saving" ? LoaderCircle : status === "saved" ? Check : status === "error" ? CircleAlert : CircleDashed;
  const label = { idle: "Autosave is on", dirty: "Unsaved changes", saving: "Saving...", saved: "Changes saved", error: "Error saving" }[status];

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <span role="status" aria-live="polite" aria-atomic="true" className={cn("inline-flex items-center gap-1.5 rounded-md bg-muted/60 px-2.5 py-1.5 text-xs font-medium text-muted-foreground", status === "saved" && "bg-success/10 text-success", status === "error" && "bg-destructive/10 text-destructive")}>
        <Icon aria-hidden="true" className={cn("size-3.5", status === "saving" && "animate-spin motion-reduce:animate-none")} />
        {label}
      </span>
      {status === "error" && <Button type="button" variant="outline" size="sm" onClick={onRetry}>Retry</Button>}
    </div>
  );
}

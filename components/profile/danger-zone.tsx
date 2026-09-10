"use client";

import { useId } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Account closure.
 *
 * The user-management service exposes no self-service delete — only admin
 * moderation can close an account — so the action is presented as unavailable
 * rather than wired to something that would not delete anything.
 */
export function DangerZone() {
  const id = useId();

  return (
    <section aria-labelledby={`${id}-title`} className="flex flex-col gap-4">
      <h2
        id={`${id}-title`}
        className="flex items-center gap-2 text-sm font-semibold text-foreground"
      >
        <AlertTriangle aria-hidden="true" className="size-4 text-destructive" />
        Danger zone
      </h2>
      <div className="flex flex-col gap-5 rounded-[var(--card-radius-lg)] border border-destructive/20 bg-destructive/[0.025] p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h3 className="text-sm font-semibold text-foreground">Delete account</h3>
          <p id={`${id}-help`} className="max-w-md text-sm leading-relaxed text-muted-foreground">
            Closing your Navio account is not yet available here. Contact Navio support and
            your account, trips, and saved vehicles will be removed for you.
          </p>
        </div>
        <Button
          type="button"
          variant="destructive"
          disabled
          aria-describedby={`${id}-help`}
          className="h-11 w-full rounded-[var(--btn-radius)] px-4 sm:w-auto"
        >
          <Trash2 aria-hidden="true" className="size-4" />
          Delete account
          <span className="ml-1 rounded-md bg-background/30 px-1.5 py-0.5 text-[0.625rem] font-medium">
            Soon
          </span>
        </Button>
      </div>
    </section>
  );
}

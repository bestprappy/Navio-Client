"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, ShieldOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { formatAdminDate, formatAdminDateTime } from "../admin-format";
import { googleUsageKeys, updateLimitOverride } from "./google-usage-api";
import type { GoogleUsageReport } from "./google-usage-model";

type LimitOverrideControlProps = {
  report: Pick<GoogleUsageReport, "resetsAt" | "limitsIgnoredSince">;
};

/**
 * Lets an administrator keep Google calls running past this month's limits, for example while
 * free trial credit pays for them. Ignoring asks first; restoring is the safe direction and does not.
 */
export function LimitOverrideControl({ report }: LimitOverrideControlProps) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const ignored = report.limitsIgnoredSince !== null;
  const resetDate = formatAdminDate(report.resetsAt);

  const override = useMutation({
    mutationFn: updateLimitOverride,
    onSuccess: (updated) => {
      queryClient.setQueryData(googleUsageKeys.root, updated);
      setConfirming(false);
    },
    onError: (error, ignoreLimits) => {
      console.error("Google usage limits could not be changed.", {
        component: "LimitOverrideControl",
        operation: ignoreLimits ? "ignoreLimits" : "restoreLimits",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });

  const openConfirm = (open: boolean) => {
    if (!open && override.isPending) return;
    override.reset();
    setConfirming(open);
  };

  return (
    <section aria-labelledby="limit-override-heading" className="flex flex-col gap-3 border-t border-border pt-6">
      <div className="flex max-w-2xl flex-col gap-1">
        <h2 id="limit-override-heading" className="font-semibold text-foreground">When a limit is reached</h2>
        {ignored ? (
          <p className="text-sm text-muted-foreground">
            Limits are ignored until{" "}
            <time dateTime={report.resetsAt}>{resetDate}</time>, chosen on{" "}
            <time dateTime={report.limitsIgnoredSince!}>{formatAdminDateTime(report.limitsIgnoredSince!)}</time>. Calls
            past the free allowance are charged to the Google Cloud billing account. Restore the limits to stop at the
            free allowance again.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Calls stop at each limit so nothing is charged. If a demo needs them to keep working and the billing account
            has credit to cover it, you can ignore the limits until the month resets.
          </p>
        )}
      </div>

      <div>
        {ignored ? (
          <Button variant="outline" size="sm" disabled={override.isPending} onClick={() => override.mutate(false)}>
            <ShieldCheck aria-hidden="true" />
            {override.isPending ? "Restoring limits…" : "Restore limits"}
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => openConfirm(true)}>
            <ShieldOff aria-hidden="true" />
            Ignore limits this month
          </Button>
        )}
      </div>

      {ignored && override.isError && (
        <p role="alert" className="text-sm text-destructive">{override.error.message}</p>
      )}

      <Dialog open={confirming} onOpenChange={openConfirm}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Ignore Google limits until {resetDate}?</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Google calls keep working after a meter passes its free allowance, and those calls are charged to the Google
            Cloud billing account. Free trial credit pays first while it lasts. Navio keeps counting, and the limits come
            back on their own on {resetDate}.
          </DialogDescription>
          {override.isError && (
            <p role="alert" className="text-sm text-destructive">{override.error.message}</p>
          )}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />} disabled={override.isPending}>
              Cancel
            </DialogClose>
            <Button
              type="button"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/40"
              disabled={override.isPending}
              onClick={() => override.mutate(true)}
            >
              <ShieldOff aria-hidden="true" />
              {override.isPending ? "Ignoring limits…" : "Ignore limits"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

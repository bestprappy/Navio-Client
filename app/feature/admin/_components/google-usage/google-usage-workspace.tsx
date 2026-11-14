"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, RotateCw, ShieldOff, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button.variants";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { formatAdminDateTime } from "../admin-format";
import { AdminErrorState } from "../admin-query-state";
import { fetchGoogleUsage, googleUsageKeys } from "./google-usage-api";
import { metersByUrgency, monthPercent, summarize } from "./google-usage-model";
import { LimitOverrideControl } from "./limit-override-control";
import { UsageLedger } from "./usage-ledger";

const REFRESH_MS = 60_000;
const CLOUD_PROJECT = "navio-495916";
const CLOUD_LINKS = [
  { label: "Quotas", path: "google/maps-apis/quotas" },
  { label: "API traffic", path: "google/maps-apis/metrics" },
  { label: "Billing", path: "billing/linkedaccount" },
] as const;

export function GoogleUsageWorkspace() {
  const usage = useQuery({
    queryKey: googleUsageKeys.root,
    queryFn: ({ signal }) => fetchGoogleUsage(signal),
    refetchInterval: REFRESH_MS,
    retry: false,
  });
  const meters = useMemo(() => metersByUrgency(usage.data?.meters ?? []), [usage.data]);

  if (usage.isPending) {
    return (
      <div role="status" aria-live="polite" className="flex flex-col gap-4">
        <span className="sr-only">Loading Google usage</span>
        <Skeleton className="h-14 w-full max-w-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }
  // Never show a failed read as zero: "0 of 950" would read as a fact.
  if (usage.isError) {
    return <AdminErrorState error={usage.error} onRetry={() => usage.refetch()} isRetrying={usage.isFetching} />;
  }

  const report = usage.data;
  const limitsIgnored = report.limitsEnforced && report.limitsIgnoredSince !== null;
  return (
    <div className="flex flex-col gap-6">
      {!report.limitsEnforced && (
        <div role="alert" className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <TriangleAlert className="size-5 shrink-0 text-destructive" aria-hidden="true" />
          <p className="text-foreground">
            Limits are switched off. Google calls are not being counted or stopped, so these numbers may be low and
            charges can happen.
          </p>
        </div>
      )}

      {limitsIgnored && (
        <div role="status" className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm">
          <ShieldOff className="size-5 shrink-0 text-warning" aria-hidden="true" />
          <p className="text-foreground">
            Limits are ignored until <time dateTime={report.resetsAt}>{formatAdminDateTime(report.resetsAt)}</time>.
            Google calls keep working past the free allowance, and those calls are billed.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex max-w-2xl flex-col gap-1">
          <p className="text-lg font-semibold text-foreground">{summarize(meters, report.limitsEnforced, limitsIgnored)}</p>
          <p className="text-sm text-muted-foreground">
            Counts restart on <time dateTime={report.resetsAt}>{formatAdminDateTime(report.resetsAt)}</time>.
            Updated <time dateTime={report.asOf}>{formatAdminDateTime(report.asOf)}</time>.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => usage.refetch()} disabled={usage.isFetching}>
          <RotateCw className={cn(usage.isFetching && "animate-spin motion-reduce:animate-none")} aria-hidden="true" />
          Refresh
        </Button>
      </div>

      {usage.isRefetchError && (
        <p role="alert" className="text-sm text-destructive">
          Could not refresh. These numbers are from the last successful update.
        </p>
      )}

      <div className="flex flex-col gap-2">
        <UsageLedger.Root report={report} todayPercent={monthPercent(report)}>
          {meters.map((meter) => <UsageLedger.Row key={meter.meter} meter={meter} />)}
        </UsageLedger.Root>
        <p className="text-sm text-muted-foreground">
          The line marks how far through the month it is. A bar past the line is using its allowance too fast to last.
        </p>
      </div>

      {report.limitsEnforced && <LimitOverrideControl report={report} />}

      <section aria-labelledby="google-cloud-heading" className="flex flex-col gap-3 border-t border-border pt-6">
        <div className="flex max-w-2xl flex-col gap-1">
          <h2 id="google-cloud-heading" className="font-semibold text-foreground">Billed usage in Google Cloud</h2>
          <p className="text-sm text-muted-foreground">
            Navio counts the calls its server makes. Maps shown in the browser, local development and anything else
            using the same key appear only in Google Cloud.
          </p>
          {!report.placesDiscoveryEnabled && (
            <p className="text-sm text-muted-foreground">
              Places discovery is off, so it makes no Google calls.
            </p>
          )}
        </div>
        <ul className="flex flex-wrap gap-2">
          {CLOUD_LINKS.map(({ label, path }) => (
            <li key={path}>
              <a
                href={`https://console.cloud.google.com/${path}?project=${CLOUD_PROJECT}`}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                {label}
                <ExternalLink aria-hidden="true" />
                <span className="sr-only">(opens Google Cloud in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import { formatAdminDate, formatCount } from "../admin-format";
import {
  meterCopy,
  meterState,
  projectedRunOut,
  usagePercent,
  type GoogleUsageMeter,
  type GoogleUsageReport,
  type MeterState,
} from "./google-usage-model";

type LedgerContext = { report: GoogleUsageReport; todayPercent: number };

const UsageLedgerContext = createContext<LedgerContext | null>(null);

function useUsageLedger(): LedgerContext {
  const context = useContext(UsageLedgerContext);
  if (!context) throw new Error("UsageLedger.Row must be used inside UsageLedger.Root.");
  return context;
}

/** Name, bar and figures. All rows share it, so the today line runs straight through every bar. */
const ROW_GRID = "grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 px-5 md:grid-cols-[17rem_minmax(0,1fr)_6.5rem]";

const BAR_TONE: Record<MeterState, string> = {
  ok: "",
  over: "[&_[data-slot=progress-indicator]]:bg-destructive",
  fast: "[&_[data-slot=progress-indicator]]:bg-warning",
  nearly: "[&_[data-slot=progress-indicator]]:bg-warning",
  reached: "[&_[data-slot=progress-indicator]]:bg-destructive",
};

function TodayLine({ percent }: { percent: number }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 w-px bg-foreground/55"
      style={{ left: `${percent}%` }}
    />
  );
}

function Root({
  report,
  todayPercent,
  children,
}: LedgerContext & { children: ReactNode }) {
  const context = useMemo(() => ({ report, todayPercent }), [report, todayPercent]);
  // Keeps the word "Today" inside the panel at the very start and end of a month.
  const labelPercent = Math.min(94, Math.max(6, todayPercent));
  return (
    <UsageLedgerContext.Provider value={context}>
      <Card className="gap-0 overflow-hidden py-0">
        <div aria-hidden="true" className={cn(ROW_GRID, "hidden border-b border-border md:grid")}>
          <span />
          <span className="relative h-8">
            <TodayLine percent={todayPercent} />
            <span
              className="absolute top-1.5 -translate-x-1/2 bg-card px-1.5 text-xs font-medium text-muted-foreground"
              style={{ left: `${labelPercent}%` }}
            >
              Today
            </span>
          </span>
          <span />
        </div>
        <ul className="divide-y divide-border">{children}</ul>
      </Card>
    </UsageLedgerContext.Provider>
  );
}

function StateBadge({ state, runOut, limitsIgnored }: { state: MeterState; runOut: Date | null; limitsIgnored: boolean }) {
  if (state === "ok") return null;
  if (state === "reached") return <Badge variant="destructive">Limit reached</Badge>;
  if (state === "over") return <Badge variant="destructive">Past free allowance, billed</Badge>;
  const runOutDate = runOut ? formatAdminDate(runOut.toISOString()) : "";
  const label = state === "nearly"
    ? "Nearly used"
    : limitsIgnored ? `Free allowance ends around ${runOutDate}` : `Runs out around ${runOutDate}`;
  return <Badge variant="outline" className="border-warning/50 bg-warning/10 text-warning">{label}</Badge>;
}

function Row({ meter }: { meter: GoogleUsageMeter }) {
  const { report, todayPercent } = useUsageLedger();
  const { name, limitEffect } = meterCopy(meter.meter);
  const percent = usagePercent(meter);
  // With limits off nothing stops at the limit, so no warning here would be true.
  const limitsIgnored = report.limitsIgnoredSince !== null;
  const state: MeterState = report.limitsEnforced ? meterState(meter, report, limitsIgnored) : "ok";
  const stopsAtLimit = report.limitsEnforced && !limitsIgnored;
  const usedText = `${formatCount(meter.used)} of ${formatCount(meter.limit)} used`;

  return (
    <li className={ROW_GRID}>
      <div className="flex min-w-0 flex-col items-start gap-1 py-4">
        <span className="font-medium text-foreground">{name}</span>
        {stopsAtLimit && <span className="text-sm text-muted-foreground">At the limit, {limitEffect}.</span>}
        <StateBadge state={state} runOut={projectedRunOut(meter, report)} limitsIgnored={limitsIgnored} />
      </div>
      <div className="relative col-span-2 flex items-center pb-4 md:order-none md:col-span-1 md:pb-0 max-md:order-last">
        <Progress
          value={percent}
          aria-label={name}
          getAriaValueText={() => usedText}
          className={cn("w-full [&_[data-slot=progress-track]]:h-2.5", BAR_TONE[state])}
        />
        <TodayLine percent={todayPercent} />
      </div>
      <p className="py-4 text-right tabular-nums">
        <span className="block font-semibold text-foreground">{formatCount(meter.used)}</span>
        <span className="block text-sm text-muted-foreground">of {formatCount(meter.limit)}</span>
      </p>
    </li>
  );
}

export const UsageLedger = { Root, Row };

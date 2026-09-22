"use client";

import { BatteryCharging } from "lucide-react";
import { useAtomValue } from "jotai";

import { cn } from "@/lib/utils";

import { arrivalReservePctAtom } from "../garage/garage.atoms";
import { BATTERY_CHANGE_TEXT, BATTERY_TONES, getBatteryTone } from "../garage/garage-formatters";

function clampPct(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** Battery bar for a charge: the part held on arrival is dimmed, the part added is lit in its level color. */
export function ChargeBar({ from, to, className }: { from: number; to: number; className?: string }) {
  const reservePct = useAtomValue(arrivalReservePctAtom);
  const start = clampPct(Math.min(from, to));
  const end = clampPct(Math.max(from, to));

  return (
    <div aria-hidden="true" className={cn("surface-groove relative h-2.5 rounded-full", className)}>
      <div
        className={cn("absolute inset-y-0 left-0 rounded-full", BATTERY_TONES[getBatteryTone(end, reservePct)].fill)}
        style={{ width: `${end}%` }}
      />
      {start > 0 && (
        <div className="absolute inset-y-0 left-0 rounded-l-full bg-background/55" style={{ width: `${start}%` }} />
      )}
    </div>
  );
}

type ChargeSegmentInfoProps = {
  batteryFrom?: number;
  batteryTo?: number;
};

export function ChargeSegmentInfo({ batteryFrom, batteryTo }: ChargeSegmentInfoProps) {
  const reservePct = useAtomValue(arrivalReservePctAtom);
  if (batteryFrom === undefined || batteryTo === undefined) return null;

  const from = clampPct(batteryFrom);
  const to = clampPct(batteryTo);

  return (
    <div className="space-y-2">
      <p className="flex items-center justify-between gap-3 text-sm">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <BatteryCharging className="size-4 shrink-0" aria-hidden="true" />
          Charging
        </span>
        <span className="font-mono font-medium tabular-nums">
          <span className="sr-only">from </span>
          <span className={BATTERY_TONES[getBatteryTone(from, reservePct)].valueText}>{from}%</span>
          <span aria-hidden="true" className="text-muted-foreground"> → </span>
          <span className="sr-only"> to </span>
          <span className={BATTERY_TONES[getBatteryTone(to, reservePct)].valueText}>{to}%</span>
          {to > from && <span className={cn("ml-2", BATTERY_CHANGE_TEXT.added)}>+{to - from}%</span>}
        </span>
      </p>
      <ChargeBar from={from} to={to} />
    </div>
  );
}

type DischargeSegmentInfoProps = {
  batteryFrom?: number;
  batteryTo?: number;
};

export function DischargeSegmentInfo({
  batteryFrom,
  batteryTo,
}: DischargeSegmentInfoProps) {
  const reservePct = useAtomValue(arrivalReservePctAtom);
  if (batteryFrom === undefined || batteryTo === undefined) return null;

  const from = clampPct(batteryFrom);
  const to = clampPct(batteryTo);
  const used = Math.max(0, from - to);
  const tone = BATTERY_TONES[getBatteryTone(to, reservePct)];

  return (
    <div className="flex h-6 items-center gap-2 text-sm leading-none">
      <span aria-hidden="true" className="relative h-2 w-8 shrink-0 rounded-full bg-muted ring-1 ring-border ring-inset">
        <span className={cn("absolute inset-y-0 left-0 rounded-full", tone.fill)} style={{ width: `${to}%` }} />
      </span>
      <span className="sr-only">
        Battery {from}% to {to}%{tone.label ? `, ${tone.label.toLowerCase()}` : ""}
      </span>
      <span aria-hidden="true" className="font-mono font-medium tabular-nums">
        <span className={BATTERY_TONES[getBatteryTone(from, reservePct)].valueText}>{from}%</span>
        <span className="text-muted-foreground"> → </span>
        <span className={tone.valueText}>{to}%</span>
      </span>
      {used > 0 && (
        <span aria-hidden="true" className={cn("font-mono tabular-nums", BATTERY_CHANGE_TEXT.used)}>
          −{used}%
        </span>
      )}
      {tone.label && (
        <span aria-hidden="true" className={cn("font-medium", tone.text)}>
          {tone.label}
        </span>
      )}
    </div>
  );
}

import { AUTO_MIN_ARRIVAL_PCT } from "./ev-calculator";

export function formatMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) return "0 min";

  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

export function formatDistanceKm(km: number): string {
  return km > 0 && km < 10 ? km.toFixed(1) : Math.round(km).toLocaleString("en-US");
}

const CONNECTOR_LABELS: Partial<Record<string, string>> = {
  TYPE1: "Type 1",
  TYPE2: "Type 2",
  CHADEMO: "CHAdeMO",
  GB_T: "GB/T",
};

export function formatConnector(connector: string): string {
  return CONNECTOR_LABELS[connector] ?? connector;
}

/** "2026-09-12" -> "12 Sep 2026"; anything unparseable is returned unchanged. */
export function formatCheckedDate(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

/** Level bands: green from 50%, yellow from 26%, orange down to the planner reserve, red below it. */
export const BATTERY_HIGH_PCT = 50;
export const BATTERY_LOW_PCT = 25;

export type BatteryTone = "high" | "mid" | "low" | "critical";

export function getBatteryTone(pct: number): BatteryTone {
  if (pct < AUTO_MIN_ARRIVAL_PCT) return "critical";
  if (pct <= BATTERY_LOW_PCT) return "low";
  if (pct < BATTERY_HIGH_PCT) return "mid";
  return "high";
}

/**
 * `fill` and `valueText` classes are defined in globals.css. `valueText` colors a percentage by its
 * level; labels keep the level readable without color.
 */
export const BATTERY_TONES: Record<BatteryTone, { fill: string; valueText: string; text: string; label: string | null }> = {
  high: { fill: "battery-fill battery-high", valueText: "battery-text-high", text: "text-foreground", label: null },
  mid: { fill: "battery-fill battery-mid", valueText: "battery-text-mid", text: "text-foreground", label: null },
  low: { fill: "battery-fill battery-low", valueText: "battery-text-low", text: "text-warning", label: "Low" },
  critical: { fill: "battery-fill battery-critical", valueText: "battery-text-critical", text: "text-destructive", label: "Below reserve" },
};

/** Battery used reads red, battery added reads green. */
export const BATTERY_CHANGE_TEXT = { used: "battery-text-critical", added: "battery-text-high" } as const;

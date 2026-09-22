"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import type { DayBatteryPoint } from "./ev-calculator";
import { formatDistanceKm } from "./garage-formatters";

type BatteryRouteChartProps = {
  points: DayBatteryPoint[];
  reservePct: number;
  className?: string;
};

const HEIGHT = 144;
const PAD = { top: 12, right: 12, bottom: 22, left: 36 };
const Y_TICKS = [0, 50, 100];
const LINE = "var(--battery-high)";
const BELOW_RESERVE = "var(--battery-critical)";

function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry?.contentRect.width ?? 0)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

function pct(value: number): string {
  return `${Math.round(value)}%`;
}

/** Battery across the day's road distance: charging stops are vertical jumps, the dashed line is the arrival reserve. */
export function BatteryRouteChart({ points, reservePct, className }: BatteryRouteChartProps) {
  const titleId = useId();
  const [containerRef, width] = useElementWidth<HTMLDivElement>();
  const [activeId, setActiveId] = useState<string | null>(null);
  const totalKm = points.at(-1)?.distanceKm ?? 0;
  const plotWidth = Math.max(0, width - PAD.left - PAD.right);
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;

  const geometry = useMemo(() => {
    const x = (km: number) => PAD.left + (totalKm > 0 ? (km / totalKm) * plotWidth : 0);
    const y = (value: number) => PAD.top + (1 - Math.max(0, Math.min(100, value)) / 100) * plotHeight;
    // Arrive, then (at a charger) jump straight up to the departure level at the same distance.
    const vertices = points.flatMap((point) =>
      point.departurePct !== point.arrivalPct
        ? [[x(point.distanceKm), y(point.arrivalPct)], [x(point.distanceKm), y(point.departurePct)]]
        : [[x(point.distanceKm), y(point.arrivalPct)]],
    );
    const line = vertices.map(([vx, vy], index) => `${index ? "L" : "M"}${vx},${vy}`).join(" ");
    const baseline = y(0);
    const area = vertices.length ? `${line} L${vertices.at(-1)![0]},${baseline} L${vertices[0]![0]},${baseline} Z` : "";
    return { x, y, line, area };
  }, [plotHeight, plotWidth, points, totalKm]);

  const lowest = points.reduce<DayBatteryPoint | null>((min, point) => (!min || point.arrivalPct < min.arrivalPct ? point : min), null);
  const last = points.at(-1);
  const active = points.find((point) => point.id === activeId) ?? null;

  return (
    <figure className={cn("min-w-0", className)} aria-labelledby={titleId}>
      <figcaption id={titleId} className="flex flex-wrap items-baseline justify-between gap-x-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Battery along the route</span>
        <span>Dashed line: {reservePct}% reserve</span>
      </figcaption>

      <div ref={containerRef} className="relative mt-2" style={{ height: HEIGHT }} onPointerLeave={() => setActiveId(null)}>
        {width > 0 && (
          <svg width={width} height={HEIGHT} className="block overflow-visible" role="presentation">
            {Y_TICKS.map((tick) => (
              <g key={tick}>
                <line x1={PAD.left} x2={width - PAD.right} y1={geometry.y(tick)} y2={geometry.y(tick)} stroke="var(--border)" strokeWidth={1} />
                <text x={PAD.left - 6} y={geometry.y(tick)} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[11px] tabular-nums">
                  {tick}%
                </text>
              </g>
            ))}
            <text x={PAD.left} y={HEIGHT - 4} className="fill-muted-foreground text-[11px] tabular-nums">0 km</text>
            <text x={width - PAD.right} y={HEIGHT - 4} textAnchor="end" className="fill-muted-foreground text-[11px] tabular-nums">
              {formatDistanceKm(totalKm)} km
            </text>

            <line
              x1={PAD.left} x2={width - PAD.right} y1={geometry.y(reservePct)} y2={geometry.y(reservePct)}
              stroke={BELOW_RESERVE} strokeWidth={1.5} strokeDasharray="4 4"
            />

            <path d={geometry.area} fill={LINE} fillOpacity={0.1} />
            <path d={geometry.line} fill="none" stroke={LINE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

            {points.map((point) => {
              const cx = geometry.x(point.distanceKm);
              const arrivalY = geometry.y(point.arrivalPct);
              const belowReserve = point.arrivalPct < reservePct;
              const isActive = point.id === activeId;
              return (
                <g key={point.id}>
                  {/* Chargers are squares at the departure level so the stop type never relies on color. */}
                  {point.isCharger ? (
                    <rect
                      x={cx - 5} y={geometry.y(point.departurePct) - 5} width={10} height={10} rx={2}
                      fill={LINE} stroke="var(--card)" strokeWidth={2}
                    />
                  ) : null}
                  <circle cx={cx} cy={arrivalY} r={isActive ? 5.5 : 4} fill={belowReserve ? BELOW_RESERVE : LINE} stroke="var(--card)" strokeWidth={2} />
                </g>
              );
            })}

            {active && (
              <line x1={geometry.x(active.distanceKm)} x2={geometry.x(active.distanceKm)} y1={PAD.top} y2={PAD.top + plotHeight} stroke="var(--muted-foreground)" strokeWidth={1} />
            )}

            {/* The end value is the headline above the chart; only a below-reserve low point gets a label. */}
            {lowest && last && lowest.id !== last.id && lowest.arrivalPct < reservePct && (
              <text x={geometry.x(lowest.distanceKm)} y={geometry.y(lowest.arrivalPct) + 16} textAnchor="middle" className="fill-foreground text-xs font-semibold tabular-nums">
                {pct(lowest.arrivalPct)}
              </text>
            )}
          </svg>
        )}

        {/* Hit targets wider than the marks; focusable so keyboard users get the same details. */}
        {width > 0 && points.map((point) => (
          <button
            key={point.id}
            type="button"
            aria-label={`${point.name}, ${formatDistanceKm(point.distanceKm)} km: arrive ${pct(point.arrivalPct)}${point.isCharger ? `, leave ${pct(point.departurePct)}` : ""}${point.arrivalPct < reservePct ? ", below reserve" : ""}`}
            className="absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ left: geometry.x(point.distanceKm), top: geometry.y(point.arrivalPct) }}
            onPointerEnter={() => setActiveId(point.id)}
            onFocus={() => setActiveId(point.id)}
            onBlur={() => setActiveId(null)}
          />
        ))}

        {active && (
          <div
            role="status"
            className={cn(
              "pointer-events-none absolute z-10 w-max max-w-48 rounded-md bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md ring-1 ring-border",
              // Sit beside the crosshair, on the side with more room, so the marks stay visible.
              geometry.x(active.distanceKm) > width / 2 && "-translate-x-full",
            )}
            style={{
              left: geometry.x(active.distanceKm) + (geometry.x(active.distanceKm) > width / 2 ? -12 : 12),
              top: PAD.top,
            }}
          >
            <p className="truncate font-medium">{active.name}</p>
            <p className="text-muted-foreground tabular-nums">
              {formatDistanceKm(active.distanceKm)} km · arrive {pct(active.arrivalPct)}
              {active.isCharger ? ` · leave ${pct(active.departurePct)}` : ""}
            </p>
            {active.arrivalPct < reservePct && <p className="font-medium text-destructive">Below reserve</p>}
          </div>
        )}
      </div>

      <details className="mt-2 text-xs">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Show as table</summary>
        <table className="mt-2 w-full text-left tabular-nums">
          <thead className="text-muted-foreground">
            <tr className="border-b border-border">
              <th scope="col" className="py-1 pr-2 font-normal">Stop</th>
              <th scope="col" className="py-1 pr-2 text-right font-normal">Km</th>
              <th scope="col" className="py-1 pr-2 text-right font-normal">Arrive</th>
              <th scope="col" className="py-1 text-right font-normal">Leave</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.id} className="border-b border-border last:border-0">
                <th scope="row" className="max-w-40 truncate py-1 pr-2 font-normal">{point.name}{point.isCharger ? " (charger)" : ""}</th>
                <td className="py-1 pr-2 text-right">{formatDistanceKm(point.distanceKm)}</td>
                <td className={cn("py-1 pr-2 text-right", point.arrivalPct < reservePct && "font-medium text-destructive")}>
                  {pct(point.arrivalPct)}{point.arrivalPct < reservePct ? " (below reserve)" : ""}
                </td>
                <td className="py-1 text-right">{point.isCharger ? pct(point.departurePct) : "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

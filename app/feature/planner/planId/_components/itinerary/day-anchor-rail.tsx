"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ChevronDown,
  CornerDownRight,
  House,
  Lock,
  MapPin,
  Pin,
  Plus,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { PlaceItem, TripAnchor } from "../constants/types";
import type { DayAnchorEdge } from "../overview/trip-builder.atoms";
import type { ResolvedDayAnchors } from "./day-anchors";
import { DayAnchorPicker } from "./day-anchor-picker";

type DayAnchorRailContextValue = {
  anchors: ResolvedDayAnchors;
  dayLabel: string;
  isFirstDay: boolean;
  dayPlaces: PlaceItem[];
  searchBias?: { lat: number; lng: number };
  ownStart: TripAnchor | null;
  ownEnd: TripAnchor | null;
  openEdge: DayAnchorEdge | null;
  setOpenEdge: (edge: DayAnchorEdge | null) => void;
  onChange: (edge: DayAnchorEdge, anchor: TripAnchor | null) => void;
};

const DayAnchorRailContext = createContext<DayAnchorRailContextValue | null>(null);

function useDayAnchorRailContext(component: string): DayAnchorRailContextValue {
  const context = useContext(DayAnchorRailContext);
  if (!context) {
    throw new Error(
      `DayAnchorRail.${component} must be rendered inside <DayAnchorRail.Root>.`,
    );
  }
  return context;
}

/** The icon doubles as a hint about whether this anchor can be shared. */
function AnchorIcon({
  anchor,
  className,
}: {
  anchor: TripAnchor | null;
  className?: string;
}) {
  if (!anchor) return <Plus className={className} aria-hidden="true" />;
  if (anchor.kind === "SAVED_PLACE") return <House className={className} aria-hidden="true" />;
  if (anchor.kind === "MANUAL") return <Pin className={className} aria-hidden="true" />;
  return <MapPin className={className} aria-hidden="true" />;
}

type DayAnchorRailRootProps = {
  anchors: ResolvedDayAnchors;
  dayLabel: string;
  isFirstDay: boolean;
  dayPlaces: PlaceItem[];
  searchBias?: { lat: number; lng: number };
  ownStart: TripAnchor | null;
  ownEnd: TripAnchor | null;
  onChange: (edge: DayAnchorEdge, anchor: TripAnchor | null) => void;
  className?: string;
  children: ReactNode;
};

/**
 * The day's shape at a glance: where it starts, where it ends.
 *
 * <p>Rendered as one card rather than two separate controls because start and
 * end are read together — the traveller is checking the day's journey, not two
 * unrelated fields.
 */
function DayAnchorRailRoot({
  anchors,
  dayLabel,
  isFirstDay,
  dayPlaces,
  searchBias,
  ownStart,
  ownEnd,
  onChange,
  className,
  children,
}: DayAnchorRailRootProps) {
  const [openEdge, setOpenEdge] = useState<DayAnchorEdge | null>(null);

  const value = useMemo<DayAnchorRailContextValue>(
    () => ({
      anchors,
      dayLabel,
      isFirstDay,
      dayPlaces,
      searchBias,
      ownStart,
      ownEnd,
      openEdge,
      setOpenEdge,
      onChange,
    }),
    [anchors, dayLabel, isFirstDay, dayPlaces, searchBias, ownStart, ownEnd, openEdge, onChange],
  );

  return (
    <DayAnchorRailContext.Provider value={value}>
      <div
        className={cn(
          "min-w-0 rounded-xl border border-border/60 bg-gradient-to-b from-card to-secondary/30 p-3",
          "shadow-xs transition-shadow hover:shadow-sm",
          className,
        )}
      >
        {children}
      </div>
    </DayAnchorRailContext.Provider>
  );
}

type AnchorRowProps = {
  edge: DayAnchorEdge;
  /** Draws the dotted line down to the next marker. */
  withConnector?: boolean;
};

function AnchorRow({ edge, withConnector = false }: AnchorRowProps) {
  const {
    anchors,
    dayLabel,
    isFirstDay,
    dayPlaces,
    searchBias,
    ownStart,
    ownEnd,
    openEdge,
    setOpenEdge,
    onChange,
  } = useDayAnchorRailContext(edge === "start" ? "Start" : "End");

  const isStart = edge === "start";
  const anchor = isStart ? anchors.start : anchors.end;
  const own = isStart ? ownStart : ownEnd;
  const carriedOver = isStart && anchors.startIsCarriedOver;
  const canClear = Boolean(own);
  const clearLabel = isStart && anchors.inheritedStart
    ? `Clear start override and follow on from ${anchors.inheritedStart.name}`
    : `Clear ${isStart ? "start" : "end"} place`;

  const handleSelect = useCallback(
    (next: TripAnchor | null) => onChange(edge, next),
    [edge, onChange],
  );

  const label = isStart ? "Starts from" : "Ends at";
  const emptyLabel = isStart
    ? isFirstDay
      ? "Set where this trip starts"
      : "Set a different start"
    : "Set tonight's stop";

  return (
    <div className="flex min-w-0 gap-3">
      <div className="flex w-3 shrink-0 flex-col items-center pt-3">
        <span
          aria-hidden="true"
          className={cn(
            "size-2.5 shrink-0 rounded-full",
            isStart
              ? "border-2 border-primary bg-background"
              : "bg-primary ring-2 ring-primary/25",
            !anchor && "border-2 border-dashed border-muted-foreground bg-transparent ring-0",
          )}
        />
        {withConnector && (
          <span
            aria-hidden="true"
            className="mt-1 w-0 flex-1 border-l border-dashed border-border"
          />
        )}
      </div>

      <button
        type="button"
        onClick={() => setOpenEdge(edge)}
        aria-haspopup="dialog"
        aria-expanded={openEdge === edge}
        className={cn(
          "group/anchor flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-1.5 text-left",
          "transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        <AnchorIcon
          anchor={anchor}
          className={cn(
            "size-4 shrink-0",
            anchor ? "text-primary" : "text-muted-foreground",
          )}
        />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            {carriedOver && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <CornerDownRight className="size-3" aria-hidden="true" />
                carried over
              </span>
            )}
            {anchor?.kind === "SAVED_PLACE" && (
              <Badge variant="secondary" title="Only you can see this. A shared copy asks each traveller for their own start point.">
                <Lock aria-hidden="true" />
                Private
              </Badge>
            )}
          </span>
          <span className="block truncate text-sm font-semibold text-foreground">
            {anchor?.name ?? emptyLabel}
          </span>
          {anchor?.address && (
            <span className="block truncate text-xs text-muted-foreground">
              {anchor.address}
            </span>
          )}
        </span>
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground transition-colors group-hover/anchor:text-foreground"
          aria-hidden="true"
        />
      </button>

      {canClear && (
        <button
          type="button"
          aria-label={clearLabel}
          title={clearLabel}
          onClick={() => {
            handleSelect(null);
            setOpenEdge(null);
          }}
          className="flex size-11 shrink-0 items-center justify-center self-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}

      <DayAnchorPicker
        open={openEdge === edge}
        onOpenChange={(open) => setOpenEdge(open ? edge : null)}
        edge={edge}
        dayLabel={dayLabel}
        current={anchor}
        canClear={canClear}
        carriedOverName={isStart ? (anchors.inheritedStart?.name ?? null) : null}
        dayPlaces={dayPlaces}
        searchBias={searchBias}
        onSelect={handleSelect}
      />
    </div>
  );
}

function DayAnchorRailStart() {
  return <AnchorRow edge="start" withConnector />;
}

function DayAnchorRailEnd() {
  return <AnchorRow edge="end" />;
}

/**
 * One-line summary for a collapsed day, so the journey still reads without
 * expanding it.
 */
function DayAnchorRailSummary({ className }: { className?: string }) {
  const { anchors } = useDayAnchorRailContext("Summary");

  if (!anchors.start && !anchors.end) {
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>
        Open this day to set where it starts and ends.
      </p>
    );
  }

  return (
    <p
      className={cn(
        "flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground",
        className,
      )}
    >
      <span className="truncate font-medium text-foreground">
        {anchors.start?.name ?? "Start not set"}
      </span>
      <ArrowDownRight className="size-3 shrink-0 -rotate-45" aria-hidden="true" />
      <span className="truncate font-medium text-foreground">
        {anchors.end?.name ?? "End not set"}
      </span>
    </p>
  );
}

export const DayAnchorRail = Object.assign(DayAnchorRailRoot, {
  Root: DayAnchorRailRoot,
  Start: DayAnchorRailStart,
  End: DayAnchorRailEnd,
  Summary: DayAnchorRailSummary,
});

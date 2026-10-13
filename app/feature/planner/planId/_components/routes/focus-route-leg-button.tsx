"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { LocateFixed } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  focusedRouteStopIdAtom,
  focusRouteLegAtom,
  routeLineModeAtom,
} from "../overview/trip-builder.atoms";

type FocusRouteLegButtonProps = {
  blockId: string;
  /** The stop the leg arrives at. */
  stopId: string;
  toName: string;
  className?: string;
};

/** Focuses one leg on the map from its travel row, switching the map to "Place" routes. */
export function FocusRouteLegButton({ blockId, stopId, toName, className }: FocusRouteLegButtonProps) {
  const mode = useAtomValue(routeLineModeAtom);
  const focusedStopId = useAtomValue(focusedRouteStopIdAtom);
  const focusLeg = useSetAtom(focusRouteLegAtom);
  const isFocused = mode === "stop" && focusedStopId === stopId;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={`Show the leg to ${toName} on the map`}
      aria-pressed={isFocused}
      title="Show this leg on the map"
      data-no-drag
      className={cn(isFocused ? "text-primary" : "text-muted-foreground", className)}
      onClick={() => focusLeg({ blockId, stopId })}
    >
      <LocateFixed className="size-3.5" aria-hidden="true" />
    </Button>
  );
}

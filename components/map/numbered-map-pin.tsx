"use client";

import type { ReactNode } from "react";
import { MapPin } from "lucide-react";

import { cn } from "@/lib/utils";

type MapPinMarkProps = {
  /** CSS colour of the pin, such as a planner block colour value. */
  color: string;
  /** CSS colour of the number. */
  foreground: string;
  selected: boolean;
  /** Dashed outline instead of a fill: a place found but not added yet. */
  pending?: boolean;
  children?: ReactNode;
};

type NumberedMapPinProps = MapPinMarkProps & {
  label: string;
  onSelect: () => void;
  children: ReactNode;
};

/** The planner's pin shape with a number or icon in its head. Not interactive on its own. */
export function MapPinMark({ color, foreground, selected, pending = false, children }: MapPinMarkProps) {
  return (
    <>
      <MapPin
        aria-hidden="true"
        className={cn(
          "transition-transform motion-reduce:transition-none [&>circle]:hidden",
          selected ? "size-12" : "size-8 hover:scale-110",
        )}
        strokeDasharray={pending ? "3 3" : undefined}
        style={{ color, fill: color, fillOpacity: pending ? 0.55 : 1, filter: "var(--map-marker-shadow)" }}
      />
      <span
        className={cn(
          "pointer-events-none absolute left-1/2 top-[41.67%] flex -translate-x-1/2 -translate-y-1/2 items-center justify-center font-bold leading-none",
          selected ? "text-sm [&_svg]:size-4" : "text-[10px] [&_svg]:size-3",
        )}
        style={{ color: foreground }}
      >
        {children}
      </span>
    </>
  );
}

/** A map pin with a number or icon in its head, as the planner draws itinerary stops. */
export function NumberedMapPin({ label, onSelect, ...mark }: NumberedMapPinProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={mark.selected}
      className="relative block cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      <MapPinMark {...mark} />
    </button>
  );
}

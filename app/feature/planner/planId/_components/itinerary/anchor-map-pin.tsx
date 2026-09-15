"use client";

import { MapPin } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { AnchorMarkerRole } from "./anchor-map-markers";

export type AnchorMapPinRole = AnchorMarkerRole & { color?: string };

function roleLabel({ day, edge }: AnchorMapPinRole): string {
  return `Day ${day} · ${edge === "start" ? "Start" : "End"}`;
}

/**
 * Pin for a day's start/end. When several roles share one spot (an overnight
 * stay ends one day and starts the next), the first role is drawn on the pin
 * and the rest appear as a corner badge and in the popover.
 */
export function AnchorMapPin({ roles }: { roles: readonly AnchorMapPinRole[] }) {
  const [primary, ...others] = roles;
  if (!primary) return null;

  const secondary = others[0];
  const accessibleName = roles
    .map((role) => `${roleLabel(role)}, stop ${role.number}`)
    .join("; ");

  return (
    <Popover>
      <PopoverTrigger
        aria-label={`${accessibleName}: ${primary.name}`}
        className="relative block cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={(event) => event.stopPropagation()}
      >
        <MapPin
          className="size-8 fill-map-pin text-map-pin drop-shadow-md [&>circle]:hidden"
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute left-1/2 top-[41.67%] -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold leading-none text-map-pin-foreground"
          style={{ color: primary.color }}
        >
          {primary.number}
        </span>
        {secondary ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-map-pin px-1 text-[9px] font-bold leading-none text-map-pin-foreground shadow-sm ring-1 ring-map-pin-foreground"
            style={others.length === 1 ? { color: secondary.color } : undefined}
          >
            {others.length === 1 ? secondary.number : `+${others.length}`}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent side="top" className="w-56 gap-2">
        <PopoverTitle>{primary.name}</PopoverTitle>
        <ul className="flex flex-col gap-1">
          {roles.map((role) => (
            <li key={role.key}>
              <PopoverDescription className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full bg-muted-foreground"
                  style={role.color ? { backgroundColor: role.color } : undefined}
                />
                <span>
                  {roleLabel(role)} · Stop {role.number}
                </span>
              </PopoverDescription>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

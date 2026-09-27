import { Flag, MapPin } from "lucide-react";

import { cn } from "@/lib/utils";

import type { PublicAnchor } from "./publication-api";

function AnchorRow({ anchor, edge }: { anchor: PublicAnchor; edge: "start" | "end" }) {
  const Icon = edge === "start" ? MapPin : Flag;
  return (
    <p className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
      <Icon className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
      <span className="shrink-0 font-medium text-foreground">{edge === "start" ? "Starts at" : "Ends at"}</span>
      <span className={cn("min-w-0 truncate", anchor.redacted && "italic")}>{anchor.name}</span>
    </p>
  );
}

/**
 * Where a published day starts and ends, by name only.
 *
 * <p>Published anchors carry no position (a private one is a placeholder), so
 * they are read here rather than drawn on the map like the owner's anchors.
 */
export function SharedDayAnchors({ startsAt, endsAt }: { startsAt?: PublicAnchor; endsAt?: PublicAnchor }) {
  if (!startsAt && !endsAt) return null;
  return (
    <div className="space-y-1.5 rounded-lg bg-muted/40 px-3 py-2.5">
      {startsAt && <AnchorRow anchor={startsAt} edge="start" />}
      {endsAt && <AnchorRow anchor={endsAt} edge="end" />}
    </div>
  );
}

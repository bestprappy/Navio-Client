"use client";

import type { CommunityFlair } from "./data";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const FLAIR_TONE_CLASSES: Record<CommunityFlair["tone"], string> = {
  reliable: "bg-success/15 text-success ring-1 ring-success/20",
  question: "bg-info/15 text-info ring-1 ring-info/20",
  unsourced: "bg-muted text-muted-foreground ring-1 ring-border",
  speculation: "bg-warning/15 text-warning ring-1 ring-warning/20",
  itinerary: "bg-primary/15 text-primary ring-1 ring-primary/20",
  food: "bg-warning/15 text-warning ring-1 ring-warning/20",
  ev: "bg-success/15 text-success ring-1 ring-success/20",
};

type CommunityFlairBadgeProps = {
  flair: CommunityFlair;
  className?: string;
};

export function CommunityFlairBadge({
  flair,
  className,
}: CommunityFlairBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent font-semibold",
        FLAIR_TONE_CLASSES[flair.tone],
        className,
      )}
    >
      {flair.label}
    </Badge>
  );
}

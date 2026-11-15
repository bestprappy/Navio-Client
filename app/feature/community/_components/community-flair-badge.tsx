"use client";

import type { CSSProperties } from "react";

import type { CommunityFlair } from "./data";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getTripBlockColorById } from "../../planner/planId/_components/constants/trip-block-colors";

/**
 * A flair drawn in its admin palette color. The palette's foreground variable
 * carries the administrator's white, black or automatic text choice per theme.
 * Deleted or unknown colors fall back to the palette default.
 */
export function flairColorStyle(colorId: string): CSSProperties {
  const color = getTripBlockColorById(colorId);
  return { backgroundColor: color.value, color: color.foreground };
}

type CommunityFlairBadgeProps = {
  flair: Pick<CommunityFlair, "label" | "colorId">;
  className?: string;
};

export function CommunityFlairBadge({
  flair,
  className,
}: CommunityFlairBadgeProps) {
  return (
    <Badge
      className={cn("max-w-full font-semibold", className)}
      style={flairColorStyle(flair.colorId)}
    >
      <span className="truncate">{flair.label}</span>
    </Badge>
  );
}

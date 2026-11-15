"use client";

import type { CSSProperties } from "react";

import type { CommunityFlair } from "./data";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { flairTextHex } from "./flair-colors";

export function flairColorStyle(
  flair: Pick<CommunityFlair, "color" | "textColor">,
): CSSProperties {
  return { backgroundColor: flair.color, color: flairTextHex(flair.textColor) };
}

type CommunityFlairBadgeProps = {
  flair: Pick<CommunityFlair, "label" | "color" | "textColor">;
  className?: string;
};

/** A flair in the color and text color its moderators chose. */
export function CommunityFlairBadge({
  flair,
  className,
}: CommunityFlairBadgeProps) {
  return (
    <Badge
      className={cn("max-w-full font-semibold", className)}
      style={flairColorStyle(flair)}
    >
      <span className="truncate">{flair.label}</span>
    </Badge>
  );
}

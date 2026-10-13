import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

import { getTripBlockColorById } from "../../../planner/planId/_components/constants/trip-block-colors";
import { GUIDE_ICONS } from "./guide-icons";
import type { GuideCategory } from "./guide-model";

const SIZES = {
  sm: "size-6 rounded-md [&_svg]:size-3.5",
  md: "size-8 rounded-lg [&_svg]:size-4",
  lg: "size-10 rounded-xl [&_svg]:size-5",
} as const;

/** The category's colour as a soft tile behind its ink, the way the planner tints tags. */
export function categoryTint(category: Pick<GuideCategory, "colorId">): CSSProperties {
  const color = getTripBlockColorById(category.colorId).value;
  return { backgroundColor: `color-mix(in oklch, ${color} 16%, transparent)`, color };
}

type CategoryIconProps = {
  category: Pick<GuideCategory, "iconId" | "colorId">;
  size?: keyof typeof SIZES;
  className?: string;
};

/** Decorative: always sits next to the category's name. */
export function CategoryIcon({ category, size = "md", className }: CategoryIconProps) {
  const { Icon } = GUIDE_ICONS[category.iconId];
  return (
    <span aria-hidden="true" className={cn("flex shrink-0 items-center justify-center", SIZES[size], className)} style={categoryTint(category)}>
      <Icon />
    </span>
  );
}

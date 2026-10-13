"use client";

import { createElement, type CSSProperties } from "react";
import Image from "next/image";
import { BedDouble, Landmark, MapPin, UtensilsCrossed, type LucideIcon } from "lucide-react";

import { GUIDE_ICONS } from "@/app/feature/admin/_components/guides/guide-icons";
import { GUIDE_ICON_IDS, type GuideIconId } from "@/app/feature/admin/_components/guides/guide-model";
import { useAtomValue } from "jotai";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { getTripBlockColorById } from "../constants/trip-block-colors";
import { isPlaceItem } from "../constants/types";
import { tripBlocksAtom } from "../overview/trip-builder.atoms";
import type { GuideSection, GuideSectionId } from "./destination-guide";

const SEED_SECTION_ICONS: Record<string, LucideIcon> = {
  visit: Landmark,
  eat: UtensilsCrossed,
  stay: BedDouble,
};

function isGuideIconId(value: string | undefined): value is GuideIconId {
  return (GUIDE_ICON_IDS as readonly string[]).includes(value ?? "");
}

function guideSectionIcon(section: Pick<GuideSection, "id" | "iconId">): LucideIcon {
  if (isGuideIconId(section.iconId)) return GUIDE_ICONS[section.iconId].Icon;
  return SEED_SECTION_ICONS[section.id as GuideSectionId] ?? MapPin;
}

type GuideSectionIconProps = {
  section: Pick<GuideSection, "id" | "iconId">;
  className?: string;
  style?: CSSProperties;
};

/** The section's category icon as the guide's writer chose it. Decorative: the section's name sits beside it. */
export function GuideSectionIcon({ section, className, style }: GuideSectionIconProps) {
  return createElement(guideSectionIcon(section), { className, style, "aria-hidden": true });
}

/** Category colour as a soft tint, for tags and empty photo tiles. */
export function guideSectionTint(section: Pick<GuideSection, "colorId">) {
  const color = getTripBlockColorById(section.colorId).value;
  return { backgroundColor: `color-mix(in oklch, ${color} 16%, transparent)`, color };
}

export function useIsPlaceInDay(blockId: string, placeId: string): boolean {
  return useAtomValue(tripBlocksAtom)
    .find((block) => block.id === blockId)
    ?.items.some((item) => isPlaceItem(item) && item.placeId === placeId) ?? false;
}

type GuidePlacePhotoProps = {
  section: Pick<GuideSection, "id" | "colorId" | "iconId">;
  imageUrl?: string;
  isLoading: boolean;
  sizes: string;
  className?: string;
};

/** A place's live photo, a skeleton while it loads, or its category icon when it has none. */
export function GuidePlacePhoto({ section, imageUrl, isLoading, sizes, className }: GuidePlacePhotoProps) {
  if (imageUrl) {
    return (
      <div className={cn("relative overflow-hidden bg-muted", className)}>
        <Image src={imageUrl} alt="" fill sizes={sizes} unoptimized className="object-cover" />
      </div>
    );
  }
  if (isLoading) return <Skeleton className={cn("rounded-none", className)} />;
  return (
    <div className={cn("flex items-center justify-center", className)} style={guideSectionTint(section)}>
      <GuideSectionIcon section={section} className="size-6" />
    </div>
  );
}

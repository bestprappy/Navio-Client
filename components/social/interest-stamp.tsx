import type { ReactNode } from "react";

import type { TravelInterest } from "@/lib/travel-interests";
import { cn } from "@/lib/utils";

/** Hue classes per community trail token, spelled out so Tailwind can see them. */
const TRAIL_INK: Record<TravelInterest["trail"], string> = {
  1: "text-trail-1 border-trail-1/55",
  2: "text-trail-2 border-trail-2/55",
  3: "text-trail-3 border-trail-3/55",
  4: "text-trail-4 border-trail-4/55",
  5: "text-trail-5 border-trail-5/55",
  6: "text-trail-6 border-trail-6/55",
};

/** Alternating tilt, like stamps pressed by hand rather than placed on a grid. */
const TILT = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2"];

type InterestStampProps = {
  interest: TravelInterest;
  index: number;
  className?: string;
};

/**
 * A travel interest drawn as a passport entry stamp: double-ruled ink border,
 * a slight hand-pressed tilt, one trail hue per interest. Static and decorative
 * in shape only; the label is ordinary text for assistive technology.
 */
export function InterestStamp({ interest, index, className }: InterestStampProps) {
  const Icon = interest.icon;
  return (
    <li
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border-2 border-double bg-card/60 px-2.5 py-1 text-sm font-semibold motion-safe:transition-transform motion-reduce:rotate-0",
        TRAIL_INK[interest.trail],
        TILT[index % TILT.length],
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {interest.label}
    </li>
  );
}

/** A stamp-shaped toggle for choosing interests in settings. */
export function InterestToggle({
  interest,
  selected,
  disabled,
  onToggle,
  children,
}: {
  interest: TravelInterest;
  selected: boolean;
  disabled?: boolean;
  onToggle: () => void;
  children?: ReactNode;
}) {
  const Icon = interest.icon;
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled && !selected}
      onClick={onToggle}
      className={cn(
        "inline-flex min-h-10 items-center gap-1.5 rounded-md border-2 px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-45",
        selected
          ? cn("border-double bg-card", TRAIL_INK[interest.trail])
          : "border-dashed border-border text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground",
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {interest.label}
      {children}
    </button>
  );
}

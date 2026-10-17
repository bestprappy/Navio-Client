"use client";

import type { ReactNode } from "react";
import {
  Carousel,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export function GuideCarousel({
  title,
  guideCount,
  children,
}: {
  title: string;
  guideCount: number;
  children: ReactNode;
}) {
  return (
    <Carousel
      opts={{
        align: "start",
        containScroll: "trimSnaps",
        dragFree: false,
        duration: 18,
        loop: false,
        skipSnaps: false,
        breakpoints: { "(prefers-reduced-motion: reduce)": { duration: 0 } },
      }}
      aria-label={`Published guides for ${title}`}
      tabIndex={0}
      className="min-w-0 space-y-3.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="flex min-h-9 items-center justify-between gap-3">
        <h4 className="min-w-0 truncate text-sm font-semibold tracking-tight">{title}</h4>
        {guideCount > 1 ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <CarouselPrevious
              aria-label={`Previous guide for ${title}`}
              size="icon-sm"
              className="static size-8 translate-y-0 border-border/60 bg-background/90 shadow-sm transition-[border-color,box-shadow,transform] hover:border-accent/30 hover:shadow-md active:scale-95 motion-reduce:transition-none"
            />
            <CarouselNext
              aria-label={`Next guide for ${title}`}
              size="icon-sm"
              className="static size-8 translate-y-0 border-border/60 bg-background/90 shadow-sm transition-[border-color,box-shadow,transform] hover:border-accent/30 hover:shadow-md active:scale-95 motion-reduce:transition-none"
            />
          </div>
        ) : null}
      </div>
      {children}
    </Carousel>
  );
}

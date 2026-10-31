"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, Signpost } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { PlaceNotesPreview } from "../../../planId/_components/block/items/place-notes";

type ReaderIntroductionProps = { title: string; authorName?: string | null; value: string };

/** The owner's note opens in full; readers can choose a shorter preview. */
export function ReaderIntroduction({ title, authorName, value }: ReaderIntroductionProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(true);
  const [overflowing, setOverflowing] = useState(false);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame || typeof ResizeObserver === "undefined") return;
    // Keep a conservative preview threshold while open, so folding never
    // removes the button needed to expand the note again.
    const measure = () => {
      const previewHeight = 18 * Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
      setOverflowing(frame.scrollHeight > previewHeight + 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    if (frame.firstElementChild) observer.observe(frame.firstElementChild);
    return () => observer.disconnect();
  }, [value]);

  const folded = !expanded && overflowing;
  return (
    <section id="reader-starting-part" aria-labelledby="reader-starting-part-title" className="scroll-mt-24 space-y-4 pt-8 pb-2">
      <div>
        <h2 id="reader-starting-part-title" className="text-xl font-semibold tracking-tight @lg/planner:text-2xl">{title}</h2>
        {authorName && (
          <p className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
            <Signpost className="size-4 shrink-0 text-primary" aria-hidden="true" />
            A note from {authorName}
          </p>
        )}
      </div>
      <div
        ref={frameRef}
        id="reader-starting-part-body"
        className={cn("max-w-prose text-sm leading-7", !expanded && "max-h-72 overflow-hidden", folded && "[mask-image:linear-gradient(to_bottom,black_60%,transparent)]")}
      >
        <PlaceNotesPreview value={value} interactive clamped={false} />
      </div>
      {(overflowing || expanded) && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-expanded={expanded}
          aria-controls="reader-starting-part-body"
          className="-ml-2 text-primary"
          onClick={() => setExpanded((open) => !open)}
        >
          {expanded ? "Show less" : "Read the whole note"}
          <ChevronDown aria-hidden="true" className={cn("size-4 transition-transform", expanded && "rotate-180")} />
        </Button>
      )}
    </section>
  );
}

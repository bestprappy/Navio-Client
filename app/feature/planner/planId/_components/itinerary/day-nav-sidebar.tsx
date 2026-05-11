"use client";

import { useEffect, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import {
  activeBlockIdAtom,
  tripBlocksAtom,
} from "../overview/trip-builder.atoms";

export function DayNavSidebar() {
  const blocks = useAtomValue(tripBlocksAtom);
  const setActiveBlockId = useSetAtom(activeBlockIdAtom);

  // Keep a ref so the scroll handler always sees the latest blocks
  // without re-registering the listener on every blocks change.
  const blocksRef = useRef(blocks);

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    const container = document.getElementById("planner-scroll-panel");
    if (!container) return;

    function handleScroll() {
      const currentBlocks = blocksRef.current;
      if (currentBlocks.length === 0) return;

      const containerTop = container!.getBoundingClientRect().top;
      // A block becomes "active" once its top edge crosses the upper 30% of the panel.
      const threshold = containerTop + container!.clientHeight * 0.3;

      let nextActiveId: string | null = null;
      for (const block of currentBlocks) {
        const el = document.getElementById(`trip-block-${block.id}`);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= threshold) {
          nextActiveId = block.id;
        }
      }

      if (nextActiveId !== null) {
        setActiveBlockId(nextActiveId);
      }
    }

    container.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => container.removeEventListener("scroll", handleScroll);
  }, [setActiveBlockId]);

  // Intentionally headless: keeps the active day in sync without rendering a day rail.
  return null;
}

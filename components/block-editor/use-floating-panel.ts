"use client";

import { useLayoutEffect, useState, type CSSProperties } from "react";
import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
  size,
  type Placement,
  type ReferenceElement,
} from "@floating-ui/dom";

type FloatingPanelOptions = {
  open: boolean;
  /** Keep this stable between renders; a new object repositions the panel. */
  reference: ReferenceElement | null;
  placement?: Placement;
  gap?: number;
  /** The tallest the panel may grow before it scrolls, in pixels. */
  maxHeight?: number;
};

type Position = { x: number; y: number; placement: Placement; reference: ReferenceElement; floating: HTMLElement };

/** Keeps a fixed-position panel next to its anchor, inside the viewport, while anything scrolls or resizes. */
export function useFloatingPanel({ open, reference, placement = "bottom-start", gap = 6, maxHeight = 360 }: FloatingPanelOptions) {
  const [floating, setFloating] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState<Position | null>(null);

  useLayoutEffect(() => {
    if (!open || !reference || !floating) return;
    let cancelled = false;
    const update = () => {
      void computePosition(reference, floating, {
        strategy: "fixed",
        placement,
        middleware: [
          offset(gap),
          flip({ padding: 8 }),
          shift({ padding: 8 }),
          size({
            padding: 8,
            apply: ({ availableHeight, elements }) => {
              elements.floating.style.maxHeight = `${Math.max(140, Math.min(maxHeight, Math.floor(availableHeight)))}px`;
            },
          }),
        ],
      }).then((result) => {
        if (!cancelled) setPosition({ x: result.x, y: result.y, placement: result.placement, reference, floating });
      });
    };
    const stop = autoUpdate(reference, floating, update);
    return () => {
      cancelled = true;
      stop();
    };
  }, [open, reference, floating, placement, gap, maxHeight]);

  // A position computed for an earlier anchor or panel is never shown.
  const current = open && position && position.reference === reference && position.floating === floating ? position : null;
  // Transparent rather than hidden until placed, so whatever is inside can take focus straight away.
  const style: CSSProperties = {
    position: "fixed",
    left: current?.x ?? 0,
    top: current?.y ?? 0,
    opacity: current ? 1 : 0,
    pointerEvents: current ? undefined : "none",
  };

  return { setFloating, style, placement: current?.placement ?? placement };
}

/** A reference that follows a rectangle the caller computes, such as the caret. */
export function createVirtualReference(getRect: () => DOMRect | null, contextElement?: Element): ReferenceElement {
  return {
    getBoundingClientRect: () => getRect() ?? new DOMRect(),
    contextElement,
  };
}

"use client";

import { type ReactNode, useEffect, useLayoutEffect, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { guideBrowseButtonId } from "./guide-dom";
import { GuideBrowserPanel } from "./guide-browser-panel";
import { closeGuideBrowserAtom, guideBrowseAtom } from "./guide.atoms";

const SCROLL_PANEL_ID = "planner-scroll-panel";

/**
 * Swaps the planning drawer for the guide browser. The plan stays mounted but
 * hidden, so its open days and edits survive, and its scroll position and the
 * Browse all button's focus come back when the traveller returns.
 */
export function GuideDrawerSwitch({ children }: { children: ReactNode }) {
  const browse = useAtomValue(guideBrowseAtom);
  const close = useSetAtom(closeGuideBrowserAtom);
  const isBrowsing = browse !== null;
  const wasBrowsing = useRef(false);
  const planScrollTop = useRef(0);
  const openedFromBlockId = useRef<string | null>(null);

  useLayoutEffect(() => {
    const panel = document.getElementById(SCROLL_PANEL_ID);
    if (isBrowsing && !wasBrowsing.current) {
      planScrollTop.current = panel?.scrollTop ?? 0;
      panel?.scrollTo({ top: 0 });
    } else if (!isBrowsing && wasBrowsing.current) {
      panel?.scrollTo({ top: planScrollTop.current });
      const blockId = openedFromBlockId.current;
      if (blockId) document.getElementById(guideBrowseButtonId(blockId))?.focus({ preventScroll: true });
    }
    wasBrowsing.current = isBrowsing;
    if (browse) openedFromBlockId.current = browse.blockId;
  }, [browse, isBrowsing]);

  // Leaving the planner must not reopen the guide on the next trip.
  useEffect(() => () => close(), [close]);

  return (
    <>
      <div hidden={isBrowsing}>{children}</div>
      {isBrowsing && <GuideBrowserPanel />}
    </>
  );
}

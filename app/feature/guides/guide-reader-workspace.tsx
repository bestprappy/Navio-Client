"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { atom, useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { BookOpen, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import styles from "./guide-reader-workspace.module.css";

export const guideReaderViewAtom = atom<"guide" | "map">("guide");
const guideReaderWidthAtom = atomWithStorage("navio:guide-reader-width", 65);
const clampWidth = (value: number) =>
  Math.min(68, Math.max(30, Number.isFinite(value) ? value : 65));

/** The document scrolls independently while the map fills the other half of the viewport. */
export function GuideReaderWorkspace({
  document,
  map,
}: {
  document: ReactNode;
  map: ReactNode;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useAtom(guideReaderWidthAtom);
  const [view, setView] = useAtom(guideReaderViewAtom);
  useEffect(() => { setView("guide"); }, [setView]);
  const percent = clampWidth(width);
  return (
    <div
      ref={container}
      className={styles.workspace}
      data-view={view}
      style={{ "--guide-width": `${percent}%` } as CSSProperties}
    >
      <div className={styles.views} role="group" aria-label="Guide view">
        <Button
          variant={view === "guide" ? "secondary" : "ghost"}
          aria-pressed={view === "guide"}
          aria-controls="guide-reading-panel"
          onClick={() => setView("guide")}
        >
          <BookOpen aria-hidden="true" />
          Guide
        </Button>
        <Button
          variant={view === "map" ? "secondary" : "ghost"}
          aria-pressed={view === "map"}
          aria-controls="guide-map-panel"
          onClick={() => setView("map")}
        >
          <Map aria-hidden="true" />
          Map
        </Button>
      </div>
      <div
        id="guide-reading-panel"
        aria-label="Guide document"
        tabIndex={0}
        className={styles.document}
      >
        {document}
      </div>
      <div
        className={styles.divider}
        role="separator"
        tabIndex={0}
        aria-label="Resize guide panel"
        aria-orientation="vertical"
        aria-valuemin={30}
        aria-valuemax={68}
        aria-valuenow={Math.round(percent)}
        aria-controls="guide-reading-panel"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          event.preventDefault();
        }}
        onPointerMove={(event) => {
          if (
            !event.currentTarget.hasPointerCapture(event.pointerId) ||
            !container.current
          )
            return;
          const bounds = container.current.getBoundingClientRect();
          setWidth(
            clampWidth(((event.clientX - bounds.left) / bounds.width) * 100),
          );
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onDoubleClick={() => setWidth(65)}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            setWidth(
              clampWidth(percent + (event.key === "ArrowLeft" ? -2 : 2)),
            );
          } else if (event.key === "Home" || event.key === "End") {
            event.preventDefault();
            setWidth(event.key === "Home" ? 30 : 68);
          }
        }}
      >
        <span />
      </div>
      <aside
        id="guide-map-panel"
        aria-label="Guide locations"
        className={styles.map}
      >
        {map}
      </aside>
    </div>
  );
}

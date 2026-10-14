"use client";

import { type CSSProperties, type ReactNode, useRef } from "react";
import { atomWithStorage } from "jotai/utils";
import { useAtom } from "jotai";
import { List, Map as MapIcon } from "lucide-react";
import { useItineraryView } from "../itinerary/table/use-itinerary-view";
import { PlannerScrollPanelContext } from "./planner-scroll-panel-context";
import styles from "./planner-workspace.module.css";

const drawerWidthAtom = atomWithStorage("navio:planner-drawer-width", 45);
/** Which half a phone shows: the itinerary or the map. */
export const plannerMobileViewAtom = atomWithStorage<"itinerary" | "map">("navio:planner-mobile-view", "itinerary");
const clamp = (value: number) => Math.min(68, Math.max(30, Number.isFinite(value) ? value : 45));

type PlannerWorkspaceProps = {
  scrollPanelId?: string;
  itinerary: ReactNode;
  map: ReactNode;
  details: ReactNode;
  /** The full-width itinerary table, shown over the planner while `?view=table` is set. */
  table?: ReactNode;
  children: ReactNode;
};

export function PlannerWorkspace({ scrollPanelId = "planner-scroll-panel", itinerary, map, details, table, children }: PlannerWorkspaceProps) {
  const [width, setWidth] = useAtom(drawerWidthAtom);
  const [view, setView] = useAtom(plannerMobileViewAtom);
  const [itineraryView] = useItineraryView();
  const isTableOpen = Boolean(table) && itineraryView === "table";
  const container = useRef<HTMLDivElement>(null);
  const percent = clamp(width);
  // The planner stays mounted under the table, so the map, scroll position and open
  // cards are as they were when the traveller switches back.
  return <PlannerScrollPanelContext value={scrollPanelId}><div ref={container} className={styles.workspace} data-view={view} data-table-open={isTableOpen || undefined} style={{ "--drawer-width": `${percent}%` } as CSSProperties}>
    {children}
    <div className={styles.tabs} role="group" aria-label="Planner view">
      <button type="button" aria-pressed={view === "itinerary"} onClick={() => setView("itinerary")}><List className="size-4" />Itinerary</button>
      <button type="button" aria-pressed={view === "map"} onClick={() => setView("map")}><MapIcon className="size-4" />Map</button>
    </div>
    <div id={scrollPanelId} className={`${styles.drawer} @container/planner`} tabIndex={0} aria-label="Trip itinerary">{itinerary}</div>
    <div className={styles.divider} role="separator" tabIndex={0} aria-label="Resize itinerary drawer" aria-orientation="vertical" aria-valuemin={30} aria-valuemax={68} aria-valuenow={Math.round(percent)} aria-controls={scrollPanelId}
      onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); event.preventDefault(); }}
      onPointerMove={(event) => { if (!event.currentTarget.hasPointerCapture(event.pointerId) || !container.current) return; const rect = container.current.getBoundingClientRect(); setWidth(clamp((event.clientX - rect.left) / rect.width * 100)); }}
      onPointerUp={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
      onDoubleClick={() => setWidth(45)}
      onKeyDown={(event) => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); setWidth(clamp(percent + (event.key === "ArrowLeft" ? -2 : 2))); } else if (event.key === "Home" || event.key === "End") { event.preventDefault(); setWidth(event.key === "Home" ? 30 : 68); } }}
    ><span /></div>
    <div className={styles.map}>{map}</div>
    {details}
    {isTableOpen && <div className={styles.table}>{table}</div>}
  </div></PlannerScrollPanelContext>;
}

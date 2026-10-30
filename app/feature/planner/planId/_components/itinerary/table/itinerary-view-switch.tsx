"use client";

import { Map as MapIcon, Table2 } from "lucide-react";

import { ViewSwitch, type ViewSwitchOption } from "../../layout/view-switch";
import { useItineraryView, type ItineraryView } from "./use-itinerary-view";

const VIEWS: readonly ViewSwitchOption<ItineraryView>[] = [
  { id: "plan", label: "Plan", Icon: MapIcon },
  { id: "table", label: "Table", Icon: Table2 },
];

/** Switches the itinerary between the cards-and-map plan and the full-width table. */
export function ItineraryViewSwitch({ className }: { className?: string }) {
  const [view, setView] = useItineraryView();
  return <ViewSwitch label="Itinerary view" views={VIEWS} value={view} onChange={setView} className={className} />;
}

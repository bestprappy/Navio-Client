"use client";
import dynamic from "next/dynamic";
import { useAtomValue } from "jotai";
import { ReaderPlacePanel } from "./reader-place-panel";
import { readerModelAtom, readerSelectionAtom } from "./reader-state";

const GoogleMap = dynamic(() => import("./reader-map-google").then(m => m.ReaderMapGoogle), { ssr:false });
const MapboxMap = dynamic(() => import("./reader-map-mapbox").then(m => m.ReaderMapMapbox), { ssr:false });
export function ReaderMap({ reveal }: { reveal: (id:string) => void }) {
  const model = useAtomValue(readerModelAtom)!;
  const selection = useAtomValue(readerSelectionAtom);
  const stop = model.stops.find(s => s.id === selection.stopId);
  return <div className="relative h-full min-h-0 w-full overflow-hidden bg-muted" aria-label="Shared trip map">
    {process.env.NEXT_PUBLIC_MAP_PROVIDER === "mapbox" ? <MapboxMap /> : <GoogleMap />}
    {stop && !selection.dismissed && <ReaderPlacePanel key={stop.id} stop={stop} reveal={reveal} />}
  </div>;
}

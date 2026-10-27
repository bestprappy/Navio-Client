"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { APIProvider, useMap } from "@vis.gl/react-google-maps";
import { LocateFixed } from "lucide-react";
import { AppearanceGoogleMap } from "@/components/map/appearance-google-map";
import { AppearanceGoogleMarker } from "@/components/map/appearance-google-marker";
import { TripLocationPin } from "../../../planId/_components/itinerary/trip-location-pin";
import { GoogleRoutePolylines, GoogleTransitLayer, TransitLinesToggle } from "../../../planId/_components/routes/google-route-layers";
import { TransitDataAttribution } from "../../../planId/_components/routes/transit-data-attribution";
import { useReaderRoutes } from "./reader-routes";
import { groupReaderMarkers } from "./reader-model";
import { readerActionAtom, readerFilterMapAtom, readerModelAtom, readerSelectionAtom } from "./reader-state";
import { readerButton } from "./reader-ui";

function Camera() {
  const map = useMap();
  const model = useAtomValue(readerModelAtom)!;
  const selection = useAtomValue(readerSelectionAtom);
  const filter = useAtomValue(readerFilterMapAtom);
  const fitted = useRef(false);
  const lastCommand = useRef(0);
  useEffect(() => {
    if (!map) return;
    const command = selection.camera;
    if (fitted.current && (!command || command.sequence === lastCommand.current)) return;
    if (command) lastCommand.current = command.sequence;
    fitted.current = true;
    if (command?.kind === "place") {
      const stop = model.stops.find(s => s.id === command.stopId);
      if (stop?.located) { map.setCenter({lat:stop.item.lat!,lng:stop.item.lng!}); map.setZoom(16); map.panBy(0,Math.min(140,Math.floor(map.getDiv().clientHeight*.18))); }
      return;
    }
    if(command?.kind==="leg") {
      const bounds=new google.maps.LatLngBounds();command.coordinates.forEach(([lng,lat])=>bounds.extend({lat,lng}));
      map.fitBounds(bounds,{top:80,right:40,left:40,bottom:Math.min(340,Math.floor(map.getDiv().clientHeight*.46))});return;
    }
    const groups = filter ? model.groups.filter(g => g.id === selection.groupId) : model.groups;
    const markers = groupReaderMarkers(groups);
    if (!markers.length) return;
    if (markers.length === 1) { map.setCenter(markers[0]); map.setZoom(13); return; }
    const bounds = new google.maps.LatLngBounds(); markers.forEach(m => bounds.extend(m));
    map.fitBounds(bounds,{top:80,right:40,left:40,bottom:Math.min(340,Math.floor(map.getDiv().clientHeight*0.46))});
  }, [map,model,selection.camera,selection.groupId,filter]);
  return null;
}
export function ReaderMapGoogle() {
  const routes=useReaderRoutes();
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [error,setError] = useState(false);
  const model = useAtomValue(readerModelAtom)!;
  const selection = useAtomValue(readerSelectionAtom);
  const filter = useAtomValue(readerFilterMapAtom);
  const action = useSetAtom(readerActionAtom);
  const markers = useMemo(() => groupReaderMarkers(filter ? model.groups.filter(g => g.id === selection.groupId) : model.groups),[model,filter,selection.groupId]);
  const first = groupReaderMarkers(model.groups)[0];
  return <>
    {key && !error ? <APIProvider apiKey={key} onError={()=>setError(true)}><AppearanceGoogleMap defaultCenter={first ?? {lat:0,lng:0}} defaultZoom={first ? 11 : 2} gestureHandling="greedy" disableDefaultUI={false} mapTypeControl={false} streetViewControl={false} clickableIcons={false} zoomControl fullscreenControl style={{width:"100%",height:"100%"}}>
      <Camera /><GoogleTransitLayer /><GoogleRoutePolylines segments={routes.segments} routeColorByBlockId={routes.colors} focusedSegmentId={routes.focusedSegmentId} />
      {markers.map(marker => <AppearanceGoogleMarker key={marker.key} position={marker} zIndex={marker.stops.some(s => s.id === selection.stopId) ? 22 : 20}>
        <TripLocationPin selectedItemId={selection.stopId ?? undefined} dimmed={!marker.stops.some(s => s.groupId === selection.groupId)} visits={marker.stops.toSorted((a,b)=>Number(b.groupId===selection.groupId)-Number(a.groupId===selection.groupId)).map(stop => {
          const group = model.groups.find(g=>g.id===stop.groupId)!;
          return {key:stop.id,itemId:stop.id,blockId:group.id,blockLabel:group.label,colorId:group.colorId,edge:"stop" as const,number:stop.number,name:stop.item.name??"Planned stop",time:stop.item.time,isEvCharger:stop.item.type==="charger"};
        })} onSelect={visit=>{if(visit.itemId)action({type:"select",stopId:visit.itemId});}} />
      </AppearanceGoogleMarker>)}
    </AppearanceGoogleMap><div className="absolute left-3 top-3 z-10 flex gap-2"><button type="button" className={readerButton} onClick={()=>action({type:"overview"})}><LocateFixed className="size-4" />Fit trip</button><TransitLinesToggle /></div></APIProvider>
    : <div className="flex h-full items-start justify-center p-6 pt-24 text-center"><div className="max-w-xs rounded-xl border border-border bg-card p-5"><h3 className="font-medium">Map unavailable</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">You can still browse every shared stop and open directions.</p></div></div>}
    {!first && <p className="absolute left-3 top-20 max-w-xs rounded-xl bg-card/95 p-3 text-xs text-muted-foreground">This plan has no shared map locations.</p>}
    <div className="[&>a]:top-16 [&>a]:bottom-auto"><TransitDataAttribution segments={routes.segments} /></div>
  </>;
}

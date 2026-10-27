"use client";
import "mapbox-gl/dist/mapbox-gl.css";
import { useCallback, useEffect, useRef, useState } from "react";
import Map, { Marker, NavigationControl, FullscreenControl, Source, Layer, type MapRef } from "react-map-gl/mapbox";
import { useAtomValue, useSetAtom } from "jotai";
import { LocateFixed } from "lucide-react";
import { MapboxMapAppearance } from "@/components/map/mapbox-map-appearance";
import { TripLocationPin } from "../../../planId/_components/itinerary/trip-location-pin";
import { groupReaderMarkers } from "./reader-model";
import { readerActionAtom, readerFilterMapAtom, readerModelAtom, readerSelectionAtom } from "./reader-state";
import { readerButton } from "./reader-ui";
import { useReaderRoutes } from "./reader-routes";
import { getRouteDrawPieces } from "../../../planId/_components/routes/route-draw";
import { defaultRouteMapColor } from "../../../planId/_components/constants/trip-block-colors";
import { TransitDataAttribution } from "../../../planId/_components/routes/transit-data-attribution";

export function ReaderMapMapbox() {
  const routes=useReaderRoutes();
  const model = useAtomValue(readerModelAtom)!;
  const selection = useAtomValue(readerSelectionAtom);
  const filter = useAtomValue(readerFilterMapAtom);
  const action = useSetAtom(readerActionAtom);
  const ref = useRef<MapRef>(null);
  const [loaded,setLoaded] = useState(false);
  const [error,setError] = useState(false);
  const fitted = useRef(false);
  const lastCommand = useRef(0);
  const markers = groupReaderMarkers(filter ? model.groups.filter(g=>g.id===selection.groupId) : model.groups);
  const first = groupReaderMarkers(model.groups)[0];
  const fit = useCallback(()=>{
    const map=ref.current;if(!map||!markers.length)return;
    const lats=markers.map(m=>m.lat),lngs=markers.map(m=>m.lng);
    map.fitBounds([[Math.min(...lngs),Math.min(...lats)],[Math.max(...lngs),Math.max(...lats)]],{padding:{top:80,right:40,left:40,bottom:Math.min(340,Math.floor(map.getContainer().clientHeight*.46))},maxZoom:14,duration:0});
  },[markers]);
  useEffect(()=>{
    if(!loaded||!ref.current)return;
    const command=selection.camera;
    if(fitted.current&&(!command||command.sequence===lastCommand.current))return;
    fitted.current=true;if(command)lastCommand.current=command.sequence;
    if(command?.kind==="place"){
      const stop=model.stops.find(s=>s.id===command.stopId);
      if(stop?.located)ref.current.flyTo({center:[stop.item.lng!,stop.item.lat!],zoom:16,duration:0,padding:{top:60,left:24,right:24,bottom:Math.min(340,Math.floor(ref.current.getContainer().clientHeight*.46))}});
    }else if(command?.kind==="leg"){
      const lngs=command.coordinates.map(c=>c[0]),lats=command.coordinates.map(c=>c[1]);
      ref.current.fitBounds([[Math.min(...lngs),Math.min(...lats)],[Math.max(...lngs),Math.max(...lats)]],{padding:{top:80,right:40,left:40,bottom:Math.min(340,Math.floor(ref.current.getContainer().clientHeight*.46))},duration:0});
    }else fit();
  },[loaded,selection.camera,model,fit]);
  const token=process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const geo:GeoJSON.FeatureCollection<GeoJSON.LineString>={type:"FeatureCollection",features:getRouteDrawPieces(routes.segments,routes.colors,defaultRouteMapColor,routes.focusedSegmentId).map(piece=>({type:"Feature",properties:{kind:piece.kind,color:piece.color,muted:piece.muted},geometry:{type:"LineString",coordinates:piece.coordinates}}))};
  if(!token||error)return <div className="p-6 pt-24 text-center text-sm text-muted-foreground">Map unavailable. You can still browse the shared stops.</div>;
  return <><Map ref={ref} mapboxAccessToken={token} initialViewState={{latitude:first?.lat??0,longitude:first?.lng??0,zoom:first?11:2}} mapStyle="mapbox://styles/mapbox/streets-v12" onLoad={()=>setLoaded(true)} onError={()=>setError(true)} style={{width:"100%",height:"100%"}}>
    <MapboxMapAppearance hidePOIs /><NavigationControl position="top-right" /><FullscreenControl position="top-right" />
    <Source id="shared-reader-routes" type="geojson" data={geo}>
      <Layer id="shared-reader-route-solid" type="line" filter={["in",["get","kind"],["literal",["drive","ride"]]]} layout={{"line-cap":"round","line-join":"round"}} paint={{"line-color":["get","color"],"line-width":4,"line-opacity":["case",["get","muted"],0.25,0.9]}} />
      <Layer id="shared-reader-route-walk" type="line" filter={["==",["get","kind"],"walk"]} paint={{"line-color":["get","color"],"line-width":4,"line-dasharray":[1,1.8],"line-opacity":["case",["get","muted"],0.25,0.9]}} />
      <Layer id="shared-reader-route-fallback" type="line" filter={["==",["get","kind"],"fallback"]} paint={{"line-color":["get","color"],"line-width":2,"line-dasharray":[2,3],"line-opacity":0.5}} />
    </Source>
    {markers.map(marker=><Marker key={marker.key} latitude={marker.lat} longitude={marker.lng} anchor="bottom"><TripLocationPin selectedItemId={selection.stopId??undefined} dimmed={!marker.stops.some(s=>s.groupId===selection.groupId)} visits={marker.stops.map(stop=>{const group=model.groups.find(g=>g.id===stop.groupId)!;return {key:stop.id,itemId:stop.id,blockId:group.id,blockLabel:group.label,colorId:group.colorId,edge:"stop" as const,number:stop.number,name:stop.item.name??"Planned stop",isEvCharger:stop.item.type==="charger"};})} onSelect={visit=>{if(visit.itemId)action({type:"select",stopId:visit.itemId});}} /></Marker>)}
  </Map><button type="button" className={`${readerButton} absolute left-3 top-3 z-10`} onClick={()=>action({type:"overview"})}><LocateFixed className="size-4" />Fit trip</button><div className="[&>a]:top-16 [&>a]:bottom-auto"><TransitDataAttribution segments={routes.segments} /></div></>;
}

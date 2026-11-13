"use client";

import { useEffect, useState } from "react";
import { APIProvider, useMap } from "@vis.gl/react-google-maps";
import { MapPinned } from "lucide-react";
import { AppearanceGoogleMap } from "@/components/map/appearance-google-map";
import { AppearanceGoogleMarker } from "@/components/map/appearance-google-marker";
import { NumberedMapPin } from "@/components/map/numbered-map-pin";
import { getTripBlockColorById } from "../planner/planId/_components/constants/trip-block-colors";
import type { Guide } from "../admin/_components/guides/guide-model";
import type { ReadingBlock } from "./guide-reading-model";
import { ReaderLocationPanel } from "../planner/_components/share/reader/reader-place-panel";

type PlaceBlock = Extract<ReadingBlock, { kind: "place" }>;
type Props = {
  guide: Guide;
  places: readonly PlaceBlock[];
  selected: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
  onReveal: (id: string) => void;
};

export function GuideReaderMap(props: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [zoomSequence, setZoomSequence] = useState(0);
  const index = props.places.findIndex(block => block.place.id === props.selected);
  const block = props.places[index];
  const place = block?.place;
  return <div className="relative size-full overflow-hidden">
    {apiKey ? <APIProvider apiKey={apiKey}><ReaderMap {...props} zoomSequence={zoomSequence} /></APIProvider> :
      <div className="flex h-full items-center justify-center gap-2 bg-muted p-6 text-sm text-muted-foreground">
        <MapPinned aria-hidden="true" className="size-5" />
        Open a place&apos;s location link to view it on a map.
      </div>}
    {place && <ReaderLocationPanel key={place.id} item={{type:"place",placeId:place.id,name:place.name,address:place.address,lat:place.lat,lng:place.lng}}
      category={place.category} located index={index} total={props.places.length} groupLabel="Guide places"
      onPrevious={() => props.onSelect(props.places[index - 1].place.id)} onNext={() => props.onSelect(props.places[index + 1].place.id)}
      onZoom={() => setZoomSequence(value => value + 1)} onClose={props.onClose} onReveal={() => props.onReveal(place.id)}
      revealLabel="View in guide" contextLabel="In this guide"
      context={<><h3 className="font-semibold">{props.guide.name}</h3><p className="text-sm text-muted-foreground">{place.name} · Place {block.number}</p>
        {place.tags.length > 0 && <ul className="flex flex-wrap gap-2">{place.tags.map(tag => <li key={tag} className="rounded-full bg-muted px-3 py-1 text-xs">{tag}</li>)}</ul>}
        <p className="text-xs leading-5 text-muted-foreground">Read the author’s explanation and recommendations beside this place in the guide.</p></>} />}
  </div>;
}
function ReaderMap({ guide, places, selected, onSelect, zoomSequence }: Props & {zoomSequence:number}) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    let frame: number | null = null;
    const resize = () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const element = map.getDiv();
        if (!element.clientWidth || !element.clientHeight) return;
        google.maps.event.trigger(map, "resize");
        const place = places.find(
          (block) => block.place.id === selected,
        )?.place;
        if (place) {
          map.panTo({ lat: place.lat, lng: place.lng });
          map.setZoom(15);
        } else if (places.length) {
          const bounds = new google.maps.LatLngBounds();
          for (const { place } of places)
            bounds.extend({ lat: place.lat, lng: place.lng });
          map.fitBounds(bounds, 56);
        }
      });
    };
    const observer = new ResizeObserver(resize);
    observer.observe(map.getDiv());
    resize();
    return () => {
      observer.disconnect();
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [map, places, selected, zoomSequence]);
  useEffect(() => {
    const place = places.find((block) => block.place.id === selected)?.place;
    if (!map || !place) return;
    map.panTo({ lat: place.lat, lng: place.lng });
    map.setZoom(15);
  }, [map, places, selected]);
  return (
    <div className="relative size-full">
    <AppearanceGoogleMap
      defaultCenter={{ lat: guide.destination.lat, lng: guide.destination.lng }}
      defaultZoom={12}
      gestureHandling="greedy"
      disableDefaultUI
      zoomControl
      className="size-full"
      style={{ width: "100%", height: "100%" }}
    >
      {places.map(({ place, number, colorId }, index) => (
        <AppearanceGoogleMarker
          key={`${place.id}-${index}`}
          position={{ lat: place.lat, lng: place.lng }}
        >
          <NumberedMapPin
            label={`Show ${place.name}`}
            color={getTripBlockColorById(colorId).value}
            foreground={getTripBlockColorById(colorId).foreground}
            selected={selected === place.id}
            onSelect={() => onSelect(place.id)}
          >
            {number}
          </NumberedMapPin>
        </AppearanceGoogleMarker>
      ))}
    </AppearanceGoogleMap>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { APIProvider, useMap } from "@vis.gl/react-google-maps";
import { MapPinned } from "lucide-react";
import { AppearanceGoogleMap } from "@/components/map/appearance-google-map";
import { AppearanceGoogleMarker } from "@/components/map/appearance-google-marker";
import { NumberedMapPin } from "@/components/map/numbered-map-pin";
import { getTripBlockColorById } from "../planner/planId/_components/constants/trip-block-colors";
import type { Guide } from "../admin/_components/guides/guide-model";
import type { ReadingBlock } from "./guide-reading-model";
import { PlacePreviewPanel } from "../planner/planId/_components/place/place-preview-panel";
import { usePlaceDetails } from "../planner/planId/_components/place/use-place-details";

type PlaceBlock = Extract<ReadingBlock, { kind: "place" }>;
type Props = {
  guide: Guide;
  places: readonly PlaceBlock[];
  selected: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
};

export function GuideReaderMap(props: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey)
    return (
      <div className="flex h-full items-center justify-center gap-2 bg-muted p-6 text-sm text-muted-foreground">
        <MapPinned aria-hidden="true" className="size-5" />
        Open a place&apos;s location link to view it on a map.
      </div>
    );
  return (
    <APIProvider apiKey={apiKey}>
      <ReaderMap {...props} />
    </APIProvider>
  );
}
function ReaderMap({ guide, places, selected, onSelect, onClose }: Props) {
  const map = useMap();
  const selectedIndex = places.findIndex((block) => block.place.id === selected);
  const selectedPlace = places[selectedIndex]?.place;
  const details = usePlaceDetails(selectedPlace?.id ?? "");
  const live = details.data;
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
  }, [map, places, selected]);
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
    {selectedPlace ? (
      <PlacePreviewPanel
        place={{
          name: selectedPlace.name,
          address: selectedPlace.address || live?.address || "",
          category: live?.category ?? selectedPlace.category,
          primaryType: live?.primaryType ?? selectedPlace.primaryType,
          description: live?.description,
          imageUrl: live?.imageUrl,
          rating: live?.rating,
          reviewCount: live?.reviewCount,
          openingHours: live?.openingHours,
          phone: live?.phone,
          website: live?.website,
        }}
        currentIndex={selectedIndex}
        total={places.length}
        isAdded={false}
        showAddAction={false}
        isLoadingDetails={details.isPending && details.fetchStatus === "fetching"}
        onPrevious={() => onSelect(places[(selectedIndex - 1 + places.length) % places.length].place.id)}
        onNext={() => onSelect(places[(selectedIndex + 1) % places.length].place.id)}
        onClose={onClose}
      />
    ) : null}
    </div>
  );
}

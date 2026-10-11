"use client";

import { useEffect } from "react";
import { APIProvider, useMap } from "@vis.gl/react-google-maps";
import { AppearanceGoogleMap as Map } from "@/components/map/appearance-google-map";
import { AppearanceGoogleMarker as MapMarker } from "@/components/map/appearance-google-marker";

import type { Coordinate, PinPickerMapProps } from "./pin-picker-map";

/** Brings a pin typed in by coordinates back into view. */
function FollowPoint({ point }: { point: Coordinate | null }) {
  const map = useMap();
  const lat = point?.lat;
  const lng = point?.lng;

  useEffect(() => {
    if (!map || lat === undefined || lng === undefined) return;
    if (!map.getBounds()?.contains({ lat, lng })) map.panTo({ lat, lng });
  }, [map, lat, lng]);

  return null;
}

export function PinPickerMapGoogle({ initial, point, onPointChange, onError }: PinPickerMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  return (
    <APIProvider apiKey={apiKey} onError={onError}>
      <Map
        defaultCenter={initial}
        defaultZoom={14}
        style={{ width: "100%", height: "100%" }}
        // Cooperative: the wheel scrolls the dialog, ctrl/two fingers zoom the map.
        gestureHandling="cooperative"
        clickableIcons={false}
        disableDefaultUI
        zoomControl
        onClick={(event) => {
          if (event.detail.latLng) onPointChange(event.detail.latLng);
        }}
      >
        {point && (
          <MapMarker
            position={point}
            draggable
            onDragEnd={onPointChange}
          />
        )}
        <FollowPoint point={point} />
      </Map>
    </APIProvider>
  );
}

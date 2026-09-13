"use client";

import { useEffect } from "react";
import { APIProvider, AdvancedMarker, Map, useMap } from "@vis.gl/react-google-maps";

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
        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? "DEMO_MAP_ID"}
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
          <AdvancedMarker
            position={point}
            draggable
            onDragEnd={(event) => {
              if (event.latLng) onPointChange(event.latLng.toJSON());
            }}
          />
        )}
        <FollowPoint point={point} />
      </Map>
    </APIProvider>
  );
}

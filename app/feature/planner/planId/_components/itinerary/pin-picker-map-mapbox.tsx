"use client";

import { useEffect, useRef } from "react";
import MapboxMap, { Marker, NavigationControl, useMap } from "react-map-gl/mapbox";

import "mapbox-gl/dist/mapbox-gl.css";

import type { Coordinate, PinPickerMapProps } from "./pin-picker-map";

/** Brings a pin typed in by coordinates back into view. */
function FollowPoint({ point }: { point: Coordinate | null }) {
  const { current: map } = useMap();
  const lat = point?.lat;
  const lng = point?.lng;

  useEffect(() => {
    if (!map || lat === undefined || lng === undefined) return;
    if (!map.getBounds()?.contains([lng, lat])) map.panTo([lng, lat]);
  }, [map, lat, lng]);

  return null;
}

export function PinPickerMapMapbox({ initial, point, onPointChange, onError }: PinPickerMapProps) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const loaded = useRef(false);
  if (!token) return null;

  return (
    <MapboxMap
      mapboxAccessToken={token}
      initialViewState={{ latitude: initial.lat, longitude: initial.lng, zoom: 14 }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      style={{ width: "100%", height: "100%" }}
      cooperativeGestures
      onLoad={() => {
        loaded.current = true;
      }}
      // A missing tile after load is harmless; only a map that never loads is fatal.
      onError={() => {
        if (!loaded.current) onError();
      }}
      onClick={(event) => onPointChange({ lat: event.lngLat.lat, lng: event.lngLat.lng })}
    >
      <NavigationControl showCompass={false} />
      {point && (
        <Marker
          latitude={point.lat}
          longitude={point.lng}
          anchor="bottom"
          draggable
          onDragEnd={(event) => onPointChange({ lat: event.lngLat.lat, lng: event.lngLat.lng })}
        />
      )}
      <FollowPoint point={point} />
    </MapboxMap>
  );
}

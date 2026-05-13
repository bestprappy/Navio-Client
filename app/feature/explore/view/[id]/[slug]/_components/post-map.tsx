"use client";

import { useState } from "react";
import Map, { NavigationControl } from "react-map-gl/mapbox";

import "mapbox-gl/dist/mapbox-gl.css";

const THAILAND_VIEW = {
  latitude: 15.87,
  longitude: 100.9925,
  zoom: 5.5,
};

export function PostMap() {
  const [mapError, setMapError] = useState<string | null>(null);
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!mapboxToken) {
    return (
      <div className="flex h-full items-center justify-center bg-muted p-8 text-center">
        <div className="max-w-sm rounded-sm border border-border bg-card p-5 shadow-xs">
          <p className="font-semibold text-foreground">Map unavailable</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Add a Mapbox token to show the map.
          </p>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="flex h-full items-center justify-center bg-muted p-8 text-center">
        <div className="max-w-sm rounded-sm border border-border bg-card p-5 shadow-xs">
          <p className="font-semibold text-foreground">Map unavailable</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {mapError}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <Map
        mapboxAccessToken={mapboxToken}
        initialViewState={THAILAND_VIEW}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        onError={(event) => {
          console.error("Post map failed to load.", {
            component: "PostMap",
            operation: "mapboxLoad",
            error: event.error,
          });
          setMapError("The map could not load. Please check the Mapbox token.");
        }}
      >
        <NavigationControl position="top-right" />
      </Map>
    </div>
  );
}

"use client";

import { APIProvider, Map } from "@vis.gl/react-google-maps";

const DEFAULT_CENTER = {
  lat: 15.87,
  lng: 100.9925,
};

export function PlanMap() {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const googleMapsMapId =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? "DEMO_MAP_ID";

  if (!googleMapsApiKey) {
    return (
      <div className="flex h-full items-center justify-center bg-muted p-8 text-center">
        <div className="max-w-sm rounded-sm border border-border bg-card p-5 shadow-xs">
          <p className="font-semibold text-foreground">Map unavailable</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Add a Google Maps API key to show the map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <APIProvider apiKey={googleMapsApiKey}>
        <Map
          defaultCenter={DEFAULT_CENTER}
          defaultZoom={5.5}
          mapId={googleMapsMapId}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapTypeControl={false}
          streetViewControl={false}
          style={{ width: "100%", height: "100%" }}
        />
      </APIProvider>
    </div>
  );
}

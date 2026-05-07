"use client";

import { useState, useCallback } from "react";
import { useAtomValue, useAtom } from "jotai";
import Map, {
  Source,
  Layer,
  Marker,
  NavigationControl,
} from "react-map-gl/mapbox";
import type { ViewState } from "react-map-gl/mapbox";
import { Navigation, MapPin, Zap } from "lucide-react";
import { activeRouteAtom, selectedStopAtom } from "./home.atoms";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

const INITIAL_VIEW: Partial<ViewState> = {
  longitude: 99.85,
  latitude: 16.3,
  zoom: 6.2,
};

const routeLayer = {
  id: "route-line",
  type: "line" as const,
  paint: {
    "line-color": "#15803d",
    "line-width": 4,
    "line-opacity": 0.9,
    "line-blur": 0.5,
  },
  layout: {
    "line-join": "round" as const,
    "line-cap": "round" as const,
  },
};

const routeGlowLayer = {
  id: "route-glow",
  type: "line" as const,
  paint: {
    "line-color": "#22c55e",
    "line-width": 10,
    "line-opacity": 0.15,
    "line-blur": 4,
  },
  layout: {
    "line-join": "round" as const,
    "line-cap": "round" as const,
  },
};

export function HomeMap() {
  const route = useAtomValue(activeRouteAtom);
  const [selectedStop, setSelectedStop] = useAtom(selectedStopAtom);
  const [viewState, setViewState] = useState<Partial<ViewState>>(INITIAL_VIEW);

  const handleMove = useCallback((evt: { viewState: ViewState }) => {
    setViewState(evt.viewState);
  }, []);

  return (
    <div className="relative flex-1 h-full min-w-0">
      <Map
        {...viewState}
        onMove={handleMove}
        mapStyle="mapbox://styles/mapbox/navigation-night-v1"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: "100%", height: "100%" }}
        reuseMaps
      >
        <NavigationControl position="top-right" />

        {/* Route glow + line */}
        <Source id="route" type="geojson" data={route.routeGeoJSON}>
          <Layer {...routeGlowLayer} />
          <Layer {...routeLayer} />
        </Source>

        {/* Origin marker */}
        <Marker
          longitude={route.origin.coordinates[0]}
          latitude={route.origin.coordinates[1]}
          anchor="center"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary shadow-xl border-2 border-primary-foreground/30">
            <Navigation
              className="w-4 h-4 text-primary-foreground"
              fill="currentColor"
            />
          </div>
        </Marker>

        {/* Destination marker */}
        <Marker
          longitude={route.destination.coordinates[0]}
          latitude={route.destination.coordinates[1]}
          anchor="bottom"
        >
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-foreground shadow-xl border-2 border-white/20">
              <MapPin className="w-4 h-4 text-background" fill="currentColor" />
            </div>
            <div className="w-0.5 h-3 bg-foreground/70" />
          </div>
        </Marker>

        {/* Charging stop markers */}
        {route.stops.map((stop, i) => {
          const isSelected = selectedStop?.id === stop.id;
          return (
            <Marker
              key={stop.id}
              longitude={stop.coordinates[0]}
              latitude={stop.coordinates[1]}
              anchor="center"
              onClick={() => setSelectedStop(isSelected ? null : stop)}
            >
              <button
                aria-label={`Charging stop: ${stop.name}`}
                className={[
                  "flex items-center justify-center rounded-full shadow-lg border-2 transition-all duration-200 cursor-pointer",
                  isSelected
                    ? "w-10 h-10 bg-amber-400 border-amber-200 scale-110"
                    : "w-8 h-8 bg-amber-500 border-amber-300/60 hover:scale-110",
                ].join(" ")}
              >
                <Zap
                  className="w-3.5 h-3.5 text-amber-950"
                  fill="currentColor"
                />
              </button>
            </Marker>
          );
        })}
      </Map>

      {/* Map legend */}
      <div className="absolute bottom-6 left-4 flex items-center gap-4 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-sm border border-white/10 text-xs text-white/80">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-primary" />
          Route
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-amber-400" />
          Charging stop
        </span>
      </div>
    </div>
  );
}

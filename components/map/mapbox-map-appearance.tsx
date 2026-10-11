"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-map-gl/mapbox";
import { applyMapboxPalette } from "./mapbox-appearance";
import { useMapAppearance } from "./use-map-appearance";

/** Change only the basemap, leaving itinerary lines and interactive place pins alone. */
export function MapboxMapAppearance({ hidePOIs = false }: { hidePOIs?: boolean }) {
  const { current: mapRef } = useMap();
  const { resolvedStyle, palette } = useMapAppearance();
  const originalVisibility = useRef(new globalThis.Map<string, "visible" | "none">());

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map) return;
    const apply = () => {
      applyMapboxPalette(map, palette, resolvedStyle, originalVisibility.current, hidePOIs);
      // Remove an old session's layer if this module is replaced through hot reload.
      if (map.getLayer("navio-3d-buildings")) map.removeLayer("navio-3d-buildings");
    };
    if (map.isStyleLoaded()) apply();
    map.on("style.load", apply);
    return () => { map.off("style.load", apply); };
  }, [mapRef, resolvedStyle, palette, hidePOIs]);

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map) return;
    map.jumpTo({ pitch: 0, bearing: 0 });
    map.touchZoomRotate.disableRotation();
    map.keyboard.disableRotation();
    map.dragRotate.disable();
    map.touchPitch.disable();
  }, [mapRef]);

  return null;
}


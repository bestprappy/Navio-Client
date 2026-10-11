"use client";

import { Map, type MapProps } from "@vis.gl/react-google-maps";

import { getGoogleMapStyles } from "./map-appearance";
import { useMapAppearance } from "./use-map-appearance";

/** Every theme uses flat raster tiles, including Dark, without requiring WebGL. */
export function AppearanceGoogleMap(props: MapProps) {
  const appearance = useMapAppearance();

  return (
    <Map
      {...props}
      // Cloud map IDs reject local styles; raster overlays preserve our custom pins.
      mapId={undefined}
      renderingType="RASTER"
      colorScheme="LIGHT"
      styles={getGoogleMapStyles(appearance.resolvedStyle)}
      defaultTilt={0}
      tilt={0}
      heading={0}
      headingInteractionEnabled={false}
      tiltInteractionEnabled={false}
      rotateControl={false}
    >
      {props.children}
    </Map>
  );
}


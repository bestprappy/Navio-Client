"use client";

import { useEffect, useMemo } from "react";
import { atom, useAtom, useAtomValue } from "jotai";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { TrainFront } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { defaultRouteMapColor } from "../constants/trip-block-colors";
import { getRouteDrawPieces, type RouteDrawPiece } from "./route-draw";
import type { RouteSegment } from "./trip-route.types";

/** Whether the map overlays every public transit line in the area. */
export const transitLinesVisibleAtom = atom(false);

// Google polylines take literal colours. White casing keeps a transit line legible
// over the day's colour and the basemap in both themes.
const RIDE_CASING_COLOR = "#ffffff";

type GoogleRoutePolylinesProps = {
  segments: RouteSegment[];
  routeColorByBlockId: Map<string, string>;
};

/** Draws trip routes: drives solid, rides in their line colour, walks dotted, misses dashed. */
export function GoogleRoutePolylines({ segments, routeColorByBlockId }: GoogleRoutePolylinesProps) {
  const map = useMap();
  const mapsLib = useMapsLibrary("maps");
  const pieces = useMemo(
    () => getRouteDrawPieces(segments, routeColorByBlockId, defaultRouteMapColor),
    [segments, routeColorByBlockId],
  );

  useEffect(() => {
    if (!map || !mapsLib || !pieces.length) return;

    const polylines = pieces.flatMap((piece) =>
      polylineOptions(piece).map((options) => new mapsLib.Polyline({ ...options, map })),
    );

    return () => {
      polylines.forEach((polyline) => polyline.setMap(null));
    };
  }, [map, mapsLib, pieces]);

  return null;
}

/** Called only once the Maps library has loaded, so `google.maps` is defined. */
function polylineOptions(piece: RouteDrawPiece): google.maps.PolylineOptions[] {
  const path = piece.coordinates.map(([lng, lat]) => ({ lat, lng }));

  switch (piece.kind) {
    case "drive":
      return [{ path, strokeColor: piece.color, strokeWeight: 5, strokeOpacity: 0.9 }];
    case "ride":
      return [
        { path, strokeColor: RIDE_CASING_COLOR, strokeWeight: 9, strokeOpacity: 0.95, zIndex: 2 },
        { path, strokeColor: piece.color, strokeWeight: 5, strokeOpacity: 1, zIndex: 3 },
      ];
    case "walk":
      return [{
        path,
        strokeColor: piece.color,
        strokeOpacity: 0,
        icons: [{
          icon: { path: google.maps.SymbolPath.CIRCLE, fillColor: piece.color, fillOpacity: 0.9, strokeOpacity: 0, scale: 2.5 },
          offset: "0",
          repeat: "10px",
        }],
      }];
    case "fallback":
      return [{
        path,
        strokeColor: piece.color,
        strokeWeight: 4,
        strokeOpacity: 0,
        icons: [{
          icon: { path: "M 0,-1 0,1", strokeOpacity: 0.65, scale: 4 },
          offset: "0",
          repeat: "20px",
        }],
      }];
  }
}

/** Google's own transit overlay: every rail and subway line in its official colour. */
export function GoogleTransitLayer() {
  const map = useMap();
  const mapsLib = useMapsLibrary("maps");
  const visible = useAtomValue(transitLinesVisibleAtom);

  useEffect(() => {
    if (!map || !mapsLib || !visible) return;
    const layer = new mapsLib.TransitLayer();
    layer.setMap(map);
    return () => layer.setMap(null);
  }, [map, mapsLib, visible]);

  return null;
}

export function TransitLinesToggle({ className }: { className?: string }) {
  const [visible, setVisible] = useAtom(transitLinesVisibleAtom);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-pressed={visible}
      onClick={() => setVisible((current) => !current)}
      className={cn(
        "rounded-sm bg-card/95 shadow-md backdrop-blur-sm",
        visible && "border-primary text-primary",
        className,
      )}
    >
      <TrainFront className="size-3.5" aria-hidden="true" />
      Transit lines
    </Button>
  );
}

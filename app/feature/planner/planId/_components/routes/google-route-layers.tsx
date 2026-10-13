"use client";

import { useEffect, useMemo } from "react";
import { atom, useAtom, useAtomValue } from "jotai";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { TrainFront } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { defaultRouteMapColor } from "../constants/trip-block-colors";
import { getRouteDrawPieces, type RouteDrawPiece } from "./route-draw";
import { ROUTE_FOCUS_MAX_ZOOM, ROUTE_FOCUS_PADDING_PX } from "./route-focus";
import { type RouteLegCamera, useRouteLegCamera } from "./use-route-leg-camera";
import type { RouteSegment } from "./trip-route.types";

/** Whether the map overlays every public transit line in the area. */
export const transitLinesVisibleAtom = atom(false);

// Google polylines take literal colours. White casing keeps a transit line legible
// over the day's colour and the basemap in both themes.
const RIDE_CASING_COLOR = "#ffffff";

// Faded legs keep the day's shape readable without competing with the focused leg.
const MUTED_OPACITY_FACTOR = 0.3;
// Focused pieces stack above every faded one, including faded transit casings.
const FOCUSED_Z_OFFSET = 10;

type GoogleRoutePolylinesProps = {
  segments: RouteSegment[];
  routeColorByBlockId: Map<string, string>;
  /** Draws this segment at full strength and fades the others. */
  focusedSegmentId?: string | null;
};

/** Draws trip routes: drives solid, rides in their line colour, walks dotted, misses dashed. */
export function GoogleRoutePolylines({ segments, routeColorByBlockId, focusedSegmentId = null }: GoogleRoutePolylinesProps) {
  const map = useMap();
  const mapsLib = useMapsLibrary("maps");
  const pieces = useMemo(
    () => getRouteDrawPieces(segments, routeColorByBlockId, defaultRouteMapColor, focusedSegmentId),
    [segments, routeColorByBlockId, focusedSegmentId],
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
  const fade = piece.muted ? MUTED_OPACITY_FACTOR : 1;
  const thin = piece.muted ? 1 : 0;
  const z = piece.muted ? 0 : FOCUSED_Z_OFFSET;

  switch (piece.kind) {
    case "drive":
      return [{ path, strokeColor: piece.color, strokeWeight: 5 - thin, strokeOpacity: 0.9 * fade, zIndex: 1 + z }];
    case "ride":
      return [
        { path, strokeColor: RIDE_CASING_COLOR, strokeWeight: 9 - thin * 2, strokeOpacity: 0.95 * fade, zIndex: 2 + z },
        { path, strokeColor: piece.color, strokeWeight: 5 - thin, strokeOpacity: fade, zIndex: 3 + z },
      ];
    case "walk":
      return [{
        path,
        strokeColor: piece.color,
        strokeOpacity: 0,
        zIndex: 1 + z,
        icons: [{
          icon: { path: google.maps.SymbolPath.CIRCLE, fillColor: piece.color, fillOpacity: 0.9 * fade, strokeOpacity: 0, scale: 2.5 },
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
        zIndex: 1 + z,
        icons: [{
          icon: { path: "M 0,-1 0,1", strokeOpacity: 0.65 * fade, scale: 4 },
          offset: "0",
          repeat: "20px",
        }],
      }];
  }
}

type GoogleRouteLegCameraProps = {
  segment: RouteSegment | null;
  /** Off while the user inspects a place, so the camera does not pull away from it. */
  enabled: boolean;
};

/** Moves the camera to the focused leg once scrolling settles, when it is off screen or too small. */
export function GoogleRouteLegCamera({ segment, enabled }: GoogleRouteLegCameraProps) {
  const map = useMap();
  const camera = useMemo<RouteLegCamera | null>(
    () =>
      map
        ? {
            getViewBounds: () => map.getBounds()?.toJSON() ?? null,
            // Google's fitBounds takes no maximum zoom, so a very short leg is capped once it settles.
            fitBounds: (bounds) => {
              map.fitBounds(bounds, ROUTE_FOCUS_PADDING_PX);
              google.maps.event.addListenerOnce(map, "idle", () => {
                if ((map.getZoom() ?? 0) > ROUTE_FOCUS_MAX_ZOOM) map.setZoom(ROUTE_FOCUS_MAX_ZOOM);
              });
            },
          }
        : null,
    [map],
  );

  useRouteLegCamera(segment, enabled, camera);
  return null;
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

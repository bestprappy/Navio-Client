"use client";

import { useEffect, useMemo } from "react";
import Image from "next/image";
import {
  AdvancedMarker,
  APIProvider,
  Map,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { MapPin, Star, X, Zap } from "lucide-react";
import { useAtom } from "jotai";

import type { Plan } from "../../../../_components/data";
import { getPlanCenter } from "../../../../_components/data";
import { getTripBlockColorById } from "@/app/feature/planner/planId/_components/constants/trip-block-colors";
import { GoogleMapsExportButton } from "@/app/feature/planner/planId/_components/routes/google-maps-export-button";
import { getTripRouteGroups } from "@/app/feature/planner/planId/_components/routes/trip-route.helpers";
import { useTripRoutesForGroups } from "@/app/feature/planner/planId/_components/routes/trip-route-query";
import type { RouteSegment } from "@/app/feature/planner/planId/_components/routes/trip-route.types";
import { cn } from "@/lib/utils";

import { selectedExplorePlanPlaceIdAtom } from "./plan-view-atoms";
import {
  formatReviewCount,
  getExplorePlanBlocks,
  getExplorePlanTripBlocks,
  type ExplorePlanPlace,
} from "./plan-view-model";

const DEFAULT_CENTER = {
  lat: 15.87,
  lng: 100.9925,
};
const DEFAULT_ROUTE_COLOR = "#1976d2";
const FLY_TO_ZOOM = 14;

type PlanMapProps = {
  plan?: Plan;
};

type PlanMapControllerProps = {
  selectedPlace: ExplorePlanPlace | null;
};

type RoutePolylinesLayerProps = {
  segments: RouteSegment[];
  routeColorByBlockId: globalThis.Map<string, string>;
};

function PlanMapController({ selectedPlace }: PlanMapControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || !selectedPlace) {
      return;
    }

    map.panTo({ lat: selectedPlace.lat, lng: selectedPlace.lng });
    map.setZoom(FLY_TO_ZOOM);
  }, [map, selectedPlace]);

  return null;
}

function RoutePolylinesLayer({
  segments,
  routeColorByBlockId,
}: RoutePolylinesLayerProps) {
  const map = useMap();
  const mapsLib = useMapsLibrary("maps");

  useEffect(() => {
    if (!map || !mapsLib || !segments.length) return;

    const polylines = segments.map((segment) => {
      const path = segment.geometry.coordinates.map(([lng, lat]) => ({
        lat,
        lng,
      }));
      const isFallback = segment.status === "fallback";

      return new mapsLib.Polyline({
        path,
        strokeColor:
          routeColorByBlockId.get(segment.blockId) ?? DEFAULT_ROUTE_COLOR,
        strokeWeight: isFallback ? 4 : 5,
        strokeOpacity: isFallback ? 0 : 0.9,
        icons: isFallback
          ? [
              {
                icon: {
                  path: "M 0,-1 0,1",
                  strokeOpacity: 0.65,
                  scale: 4,
                },
                offset: "0",
                repeat: "20px",
              },
            ]
          : undefined,
        map,
      });
    });

    return () => {
      polylines.forEach((polyline) => polyline.setMap(null));
    };
  }, [map, mapsLib, routeColorByBlockId, segments]);

  return null;
}

export function PlanMap({ plan }: PlanMapProps) {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const googleMapsMapId =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? "DEMO_MAP_ID";
  const [selectedPlaceId, setSelectedPlaceId] = useAtom(
    selectedExplorePlanPlaceIdAtom,
  );
  const displayBlocks = useMemo(() => getExplorePlanBlocks(plan), [plan]);
  const tripBlocks = useMemo(() => getExplorePlanTripBlocks(plan), [plan]);
  const routeGroups = useMemo(
    () => getTripRouteGroups(tripBlocks),
    [tripBlocks],
  );
  const tripRoutes = useTripRoutesForGroups(routeGroups);
  const routeSegments = useMemo(
    () => tripRoutes.data?.segments ?? [],
    [tripRoutes.data?.segments],
  );
  const routeColorByBlockId = useMemo(() => {
    const colorMap = new globalThis.Map<string, string>();

    displayBlocks.forEach((block) => {
      colorMap.set(block.id, getTripBlockColorById(block.colorId).mapColor);
    });

    return colorMap;
  }, [displayBlocks]);
  const places = useMemo(
    () => displayBlocks.flatMap((block) => block.places),
    [displayBlocks],
  );
  const selectedPlace = useMemo(
    () =>
      selectedPlaceId
        ? (places.find((place) => place.displayId === selectedPlaceId) ?? null)
        : null,
    [places, selectedPlaceId],
  );
  const center = plan ? getPlanCenter(plan.id) : DEFAULT_CENTER;
  const selectedRouteBlock = selectedPlace
    ? (displayBlocks.find((block) => block.id === selectedPlace.blockId) ?? null)
    : null;
  const selectedRouteBlockId =
    selectedRouteBlock && selectedRouteBlock.type !== "list"
      ? selectedRouteBlock.id
      : null;
  const visibleRouteSegments = useMemo(
    () =>
      selectedRouteBlockId
        ? routeSegments.filter((segment) => segment.blockId === selectedRouteBlockId)
        : [],
    [routeSegments, selectedRouteBlockId],
  );
  const routeStatusMessage = selectedRouteBlockId && tripRoutes.isFetching
    ? "Calculating routes..."
    : selectedRouteBlockId && tripRoutes.isError
      ? "Routes could not load."
      : null;

  useEffect(() => {
    if (selectedPlaceId && !selectedPlace) {
      setSelectedPlaceId(null);
    }
  }, [selectedPlace, selectedPlaceId, setSelectedPlaceId]);

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
          defaultCenter={center}
          defaultZoom={places.length > 1 ? 10 : 12}
          mapId={googleMapsMapId}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapTypeControl={false}
          streetViewControl={false}
          style={{ width: "100%", height: "100%" }}
        >
          <PlanMapController selectedPlace={selectedPlace} />
          <RoutePolylinesLayer
            segments={visibleRouteSegments}
            routeColorByBlockId={routeColorByBlockId}
          />
          {places.map((place) => {
            const isSelected = selectedPlaceId === place.displayId;
            const blockColor = getTripBlockColorById(place.colorId);

            return (
              <AdvancedMarker
                key={place.displayId}
                position={{ lat: place.lat, lng: place.lng }}
              >
                <button
                  type="button"
                  aria-label={`Show ${place.name} from ${place.blockTitle}`}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedPlaceId(place.displayId)}
                  className="relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                >
                  <MapPin
                    className={cn(
                      "transition-all [&>circle]:hidden",
                      isSelected
                        ? "size-12 drop-shadow-lg"
                        : "size-8 drop-shadow-md hover:scale-110",
                    )}
                    style={{
                      color: blockColor.value,
                      fill: blockColor.value,
                      filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.35))",
                    }}
                    aria-hidden="true"
                  />
                  <span
                    className={cn(
                      "pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-1/2 font-bold leading-none transition-all",
                      isSelected ? "text-sm" : "text-[10px]",
                    )}
                    style={{
                      color: blockColor.foreground,
                      top: "41.67%",
                    }}
                  >
                    {place.isEvCharger ? (
                      <Zap
                        className={isSelected ? "size-5" : "size-3"}
                        fill="currentColor"
                        aria-hidden="true"
                      />
                    ) : (
                      place.position
                    )}
                  </span>
                </button>
              </AdvancedMarker>
            );
          })}
        </Map>
      </APIProvider>

      <GoogleMapsExportButton
        blocks={tripBlocks}
        className="absolute left-4 top-4 z-10"
      />

      {routeStatusMessage ? (
        <div className="absolute left-4 top-16 z-10 rounded-sm border border-border bg-card px-3 py-2 text-xs font-medium text-card-foreground shadow-md">
          {routeStatusMessage}
        </div>
      ) : null}

      {selectedPlace ? (
        <PlanPlacePreview
          place={selectedPlace}
          onClose={() => setSelectedPlaceId(null)}
        />
      ) : null}
    </div>
  );
}

function PlanPlacePreview({
  place,
  onClose,
}: {
  place: ExplorePlanPlace;
  onClose: () => void;
}) {
  return (
    <aside className="absolute bottom-4 left-4 right-4 z-10 overflow-hidden rounded-sm border border-border bg-card text-card-foreground shadow-xl">
      {place.imageUrl ? (
        <div className="relative h-32 w-full bg-muted sm:h-36">
          <Image
            src={place.imageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) calc(100vw - 2rem), 420px"
            unoptimized={isGooglePlacePhoto(place.imageUrl)}
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="rounded-sm bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
            {place.blockTitle}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            aria-label="Close place preview"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-bold leading-tight text-foreground">
              {place.name}
            </h2>
            {place.description ? (
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {place.description}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2 text-sm text-muted-foreground">
            {place.rating ? (
              <div className="flex items-center gap-2">
                <Star
                  className="size-4 fill-yellow-400 text-yellow-400"
                  aria-hidden="true"
                />
                <span>
                  {place.rating.toFixed(1)}
                  {place.reviewCount
                    ? ` (${formatReviewCount(place.reviewCount)} reviews)`
                    : ""}
                </span>
              </div>
            ) : null}
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{place.address}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function isGooglePlacePhoto(imageUrl?: string): boolean {
  return Boolean(
    imageUrl &&
      (imageUrl.includes("googleusercontent.com") ||
        imageUrl.includes("places.googleapis.com") ||
        imageUrl.includes("maps.googleapis.com")),
  );
}

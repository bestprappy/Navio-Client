"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  APIProvider,
  AdvancedMarker,
  Map,
  type MapMouseEvent,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { MapPin, Zap } from "lucide-react";

import { sidebarCollapsedAtom } from "@/app/configs/constant";
import { cn } from "@/lib/utils";

import { ChargerPreviewPanel } from "./_components/charger/charger-preview-panel";
import { getTripBlockColorById } from "./_components/constants/trip-block-colors";
import type { TripBlockData } from "./_components/constants/types";
import { activeEvCarAtom } from "./_components/garage/garage.atoms";
import { isCompatible } from "./_components/garage/ev-calculator";
import {
  activeBlockIdAtom,
  activeSearchAtom,
  addSelectedEvChargerToTripAtom,
  addSelectedPlaceToTripAtom,
  closeSelectedEvChargerAtom,
  closeSelectedSearchPlaceAtom,
  closeSelectedTripPlaceAtom,
  evChargerErrorAtom,
  evChargerLoadingAtom,
  evChargerResultsAtom,
  selectEvChargerAtom,
  selectedEvChargerIsAddedAtom,
  selectedEvChargerResultAtom,
  selectedSearchPlaceAtom,
  selectedSearchPlaceIsAddedAtom,
  selectedTripPlaceAtom,
  selectedTripPlaceMarkersAtom,
  selectedTripPlacesAtom,
  selectSearchResultAtom,
  selectTripPlaceAtom,
  startPlaceSearchAtom,
  stepSearchResultAtom,
  tripBlocksAtom,
} from "./_components/overview/trip-builder.atoms";
import { PlacePreviewPanel } from "./_components/place/place-preview-panel";
import { fetchPlaceDetail } from "./_components/place/place-api";
import { TripPlacePreviewPanel } from "./_components/place/trip-place-preview-panel";
import { GoogleMapsExportButton } from "./_components/routes/google-maps-export-button";
import { useTripRoutes } from "./_components/routes/trip-route-query";
import type {
  RouteSegment,
  RouteSegmentStatus,
} from "./_components/routes/trip-route.types";

// --- Types ---

type PlannerMapGoogleProps = {
  latitude: number;
  longitude: number;
};

type LatLng = { lat: number; lng: number };

type RoutePolylinesLayerProps = {
  segments: RouteSegment[];
  routeColorByBlockId: globalThis.Map<string, string>;
};

type MapControllerProps = {
  selectedPlaceCoord: LatLng | null;
  evChargerCoord: LatLng | null;
  tripPlaceCoord: LatLng | null;
};

type MapResizeHandlerProps = {
  sidebarCollapsed: boolean;
};

// --- Constants ---

const DEFAULT_ROUTE_COLOR = "#1976d2";
const FLY_TO_ZOOM = 14;

// --- Child map components (must be inside <Map>) ---

function MapController({
  selectedPlaceCoord,
  evChargerCoord,
  tripPlaceCoord,
}: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || !selectedPlaceCoord) return;
    map.panTo(selectedPlaceCoord);
    map.setZoom(FLY_TO_ZOOM);
  }, [map, selectedPlaceCoord]);

  useEffect(() => {
    if (!map || !evChargerCoord) return;
    map.panTo(evChargerCoord);
    map.setZoom(FLY_TO_ZOOM);
  }, [map, evChargerCoord]);

  useEffect(() => {
    if (!map || !tripPlaceCoord) return;
    map.panTo(tripPlaceCoord);
    map.setZoom(FLY_TO_ZOOM);
  }, [map, tripPlaceCoord]);

  return null;
}

function MapResizeHandler({ sidebarCollapsed }: MapResizeHandlerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const timeout = window.setTimeout(() => {
      if (typeof google !== "undefined") {
        google.maps.event.trigger(map, "resize");
      }
    }, 260);
    return () => window.clearTimeout(timeout);
  }, [map, sidebarCollapsed]);

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
      const color =
        routeColorByBlockId.get(segment.blockId) ?? DEFAULT_ROUTE_COLOR;
      const isFallback = segment.status === "fallback";

      return new mapsLib.Polyline({
        path,
        strokeColor: color,
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
      polylines.forEach((p) => p.setMap(null));
    };
  }, [map, mapsLib, segments, routeColorByBlockId]);

  return null;
}

// --- Shared error / unavailable UI ---

function MapUnavailable({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center bg-muted p-8 text-center">
      <div className="max-w-sm rounded-sm border border-border bg-card p-5 shadow-xs">
        <p className="font-semibold text-foreground">Map preview unavailable</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

// --- Helpers ---

function useRouteColorByBlockId(
  tripBlocks: TripBlockData[],
): globalThis.Map<string, string> {
  return useMemo(() => {
    const map = new globalThis.Map<string, string>();
    tripBlocks.forEach((block) => {
      const blockColor = getTripBlockColorById(block.colorId);
      map.set(block.id, blockColor.mapColor);
    });
    return map;
  }, [tripBlocks]);
}

// --- Main component ---

export function PlannerMapGoogle({ latitude, longitude }: PlannerMapGoogleProps) {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const googleMapsMapId =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? "DEMO_MAP_ID";

  const sidebarCollapsed = useAtomValue(sidebarCollapsedAtom);
  const activeSearch = useAtomValue(activeSearchAtom);
  const tripBlocks = useAtomValue(tripBlocksAtom);
  const selectedPlace = useAtomValue(selectedSearchPlaceAtom);
  const selectedTripPlace = useAtomValue(selectedTripPlaceAtom);
  const selectedTripPlaces = useAtomValue(selectedTripPlacesAtom);
  const selectedTripPlaceMarkers = useAtomValue(selectedTripPlaceMarkersAtom);
  const activeEvCar = useAtomValue(activeEvCarAtom);
  const evChargerResults = useAtomValue(evChargerResultsAtom);
  const selectedEvChargerResult = useAtomValue(selectedEvChargerResultAtom);
  const selectedEvChargerIsAdded = useAtomValue(selectedEvChargerIsAddedAtom);
  const isLoadingEvChargers = useAtomValue(evChargerLoadingAtom);
  const evChargerError = useAtomValue(evChargerErrorAtom);
  const isSelectedPlaceAdded = useAtomValue(selectedSearchPlaceIsAddedAtom);
  const activeBlockId = useAtomValue(activeBlockIdAtom);
  const selectSearchResult = useSetAtom(selectSearchResultAtom);
  const selectEvCharger = useSetAtom(selectEvChargerAtom);
  const selectTripPlace = useSetAtom(selectTripPlaceAtom);
  const stepSearchResult = useSetAtom(stepSearchResultAtom);
  const addSelectedEvChargerToTrip = useSetAtom(addSelectedEvChargerToTripAtom);
  const addSelectedPlaceToTrip = useSetAtom(addSelectedPlaceToTripAtom);
  const closeSelectedEvCharger = useSetAtom(closeSelectedEvChargerAtom);
  const closeSelectedSearchPlace = useSetAtom(closeSelectedSearchPlaceAtom);
  const closeSelectedTripPlace = useSetAtom(closeSelectedTripPlaceAtom);
  const startPlaceSearch = useSetAtom(startPlaceSearchAtom);

  const selectedTripPlaceIds = useMemo(
    () => new Set(selectedTripPlaces.map((place) => place.placeId)),
    [selectedTripPlaces],
  );
  const blockColorById = useMemo(
    () =>
      new globalThis.Map(
        tripBlocks.map((block) => [
          block.id,
          getTripBlockColorById(block.colorId),
        ]),
      ),
    [tripBlocks],
  );
  const routeColorByBlockId = useRouteColorByBlockId(tripBlocks);
  const activeSearchColor = activeSearch
    ? blockColorById.get(activeSearch.blockId)
    : null;
  const tripRoutes = useTripRoutes();
  const routeSegments = useMemo(
    () => tripRoutes.data?.segments ?? [],
    [tripRoutes.data?.segments],
  );
  const routeStatusMessage = tripRoutes.isFetching
    ? "Calculating routes..."
    : tripRoutes.isError
      ? "Routes could not load."
      : null;
  const canAddToTrip = tripBlocks.length > 0;

  // Coords passed to MapController for fly-to animations
  const selectedPlaceCoord = useMemo<LatLng | null>(
    () => (selectedPlace ? { lat: selectedPlace.lat, lng: selectedPlace.lng } : null),
    [selectedPlace],
  );
  const evChargerCoord = useMemo<LatLng | null>(
    () =>
      selectedEvChargerResult
        ? {
            lat: selectedEvChargerResult.charger.location.lat,
            lng: selectedEvChargerResult.charger.location.lng,
          }
        : null,
    [selectedEvChargerResult],
  );
  const tripPlaceCoord = useMemo<LatLng | null>(
    () =>
      selectedTripPlace
        ? { lat: selectedTripPlace.lat, lng: selectedTripPlace.lng }
        : null,
    [selectedTripPlace],
  );

  const handleMapPoiClick = useCallback(
    async (event: MapMouseEvent) => {
      const placeId = event.detail.placeId;
      if (!placeId) return;
      event.stop();

      try {
        const place = await fetchPlaceDetail(placeId, "GOOGLE");
        const blockId = (activeBlockId || tripBlocks[0]?.id) ?? "";
        startPlaceSearch({ blockId, result: place });
      } catch {
        // Silently ignore failed POI detail fetches
      }
    },
    [activeBlockId, startPlaceSearch, tripBlocks],
  );

  if (!googleMapsApiKey) {
    return (
      <MapUnavailable message="Add a Google Maps API key to show the map." />
    );
  }

  return (
    <div className="relative h-full min-w-0 overflow-hidden">
      <APIProvider apiKey={googleMapsApiKey}>
        <Map
          defaultCenter={{ lat: latitude, lng: longitude }}
          defaultZoom={11}
          mapId={googleMapsMapId}
          gestureHandling="greedy"
          clickableIcons={true}
          disableDefaultUI={false}
          mapTypeControl={false}
          streetViewControl={false}
          style={{ width: "100%", height: "100%" }}
          onClick={handleMapPoiClick}
        >
          <MapController
            selectedPlaceCoord={selectedPlaceCoord}
            evChargerCoord={evChargerCoord}
            tripPlaceCoord={tripPlaceCoord}
          />
          <MapResizeHandler sidebarCollapsed={sidebarCollapsed} />
          <RoutePolylinesLayer
            segments={routeSegments}
            routeColorByBlockId={routeColorByBlockId}
          />

          {/* Saved trip place markers */}
          {selectedTripPlaceMarkers.map((place) => {
            const isSelected = selectedTripPlace?.id === place.id;
            const blockColor = getTripBlockColorById(place.blockColorId);

            return (
              <AdvancedMarker
                key={place.id}
                position={{ lat: place.lat, lng: place.lng }}
              >
                <button
                  type="button"
                  className="relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                  aria-label={`Select saved ${place.isEvCharger ? "EV station" : "place"} ${place.name}`}
                  onClick={() => selectTripPlace({ itemId: place.id })}
                >
                  <MapPin
                    className={cn(
                      "transition-all [&>circle]:hidden",
                      isSelected
                        ? "size-12 drop-shadow-lg"
                        : "size-8 drop-shadow-md",
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
                    style={{ top: "41.67%", color: blockColor.foreground }}
                  >
                    {place.isEvCharger ? (
                      <Zap
                        className={isSelected ? "size-5" : "size-3"}
                        fill="currentColor"
                        aria-hidden="true"
                      />
                    ) : (
                      place.placeSequence
                    )}
                  </span>
                </button>
              </AdvancedMarker>
            );
          })}

          {/* EV charger markers */}
          {evChargerResults.map((result) => {
            if (selectedTripPlaceIds.has(`ev-charger:${result.charger.id}`)) {
              return null;
            }

            const isSelected =
              selectedEvChargerResult?.charger.id === result.charger.id;
            const blockColor = blockColorById.get(result.targetBlockId);
            const pinFill =
              isSelected && blockColor
                ? blockColor.value
                : "var(--primary-foreground)";
            const iconColor =
              isSelected && blockColor
                ? blockColor.foreground
                : "var(--primary)";

            return (
              <AdvancedMarker
                key={result.charger.id}
                position={{
                  lat: result.charger.location.lat,
                  lng: result.charger.location.lng,
                }}
              >
                <button
                  type="button"
                  aria-label={`Select EV station ${result.charger.name}`}
                  onClick={() => selectEvCharger(result.charger.id)}
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
                      color: pinFill,
                      fill: pinFill,
                      filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.35))",
                    }}
                    aria-hidden="true"
                  />
                  <span
                    className="pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all"
                    style={{ top: "41.67%", color: iconColor }}
                  >
                    <Zap
                      className={isSelected ? "size-5" : "size-3.5"}
                      fill="currentColor"
                      aria-hidden="true"
                    />
                  </span>
                </button>
              </AdvancedMarker>
            );
          })}

          {/* Search result markers */}
          {activeSearch?.results.map((place, index) => {
            if (selectedTripPlaceIds.has(place.id)) return null;

            const isSelected = activeSearch.selectedIndex === index;

            return (
              <AdvancedMarker
                key={place.id}
                position={{ lat: place.lat, lng: place.lng }}
              >
                <button
                  type="button"
                  aria-label={`Select ${place.name} result ${index + 1}`}
                  onClick={() => selectSearchResult({ index })}
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                >
                  <MapPin
                    className={cn(
                      "transition-all",
                      isSelected
                        ? "size-10 drop-shadow-lg"
                        : "size-7 drop-shadow-sm hover:scale-110",
                    )}
                    style={{
                      color:
                        isSelected && activeSearchColor
                          ? activeSearchColor.foreground
                          : "var(--foreground)",
                      fill:
                        isSelected && activeSearchColor
                          ? activeSearchColor.value
                          : "var(--card)",
                    }}
                    aria-hidden="true"
                  />
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

      {isLoadingEvChargers || evChargerError ? (
        <div
          className={cn(
            "absolute left-4 z-10 rounded-sm border border-border bg-card px-3 py-2 text-xs font-medium text-card-foreground shadow-md",
            routeStatusMessage ? "top-28" : "top-16",
          )}
        >
          {isLoadingEvChargers ? "Loading EV stations..." : evChargerError}
        </div>
      ) : null}

      {activeSearch && selectedPlace ? (
        <PlacePreviewPanel
          place={selectedPlace}
          currentIndex={activeSearch.selectedIndex}
          total={activeSearch.results.length}
          isAdded={isSelectedPlaceAdded}
          canAddToTrip={canAddToTrip}
          onPrevious={() => stepSearchResult({ direction: "previous" })}
          onNext={() => stepSearchResult({ direction: "next" })}
          onAddToTrip={() => addSelectedPlaceToTrip()}
          onClose={() => closeSelectedSearchPlace()}
        />
      ) : selectedEvChargerResult ? (
        <ChargerPreviewPanel
          result={selectedEvChargerResult}
          isAdded={selectedEvChargerIsAdded}
          isCompatible={
            activeEvCar
              ? isCompatible(
                  activeEvCar.connectorTypes,
                  selectedEvChargerResult.charger.connectorTypes,
                )
              : true
          }
          onAddToTrip={() => addSelectedEvChargerToTrip()}
          onClose={() => closeSelectedEvCharger()}
        />
      ) : selectedTripPlace ? (
        <TripPlacePreviewPanel
          place={selectedTripPlace}
          onClose={() => closeSelectedTripPlace()}
        />
      ) : null}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import Map, {
  FullscreenControl,
  Layer,
  type MapRef,
  Marker,
  NavigationControl,
  Source,
} from "react-map-gl/mapbox";
import { MapPin, Zap } from "lucide-react";

import { sidebarCollapsedAtom } from "@/app/configs/constant";
import { cn } from "@/lib/utils";

import "mapbox-gl/dist/mapbox-gl.css";

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
import {
  fetchNearbyPlaces,
  type PlaceSearchResult,
} from "./_components/place/place-api";
import { TripPlacePreviewPanel } from "./_components/place/trip-place-preview-panel";
import { GoogleMapsExportButton } from "./_components/routes/google-maps-export-button";
import { useTripRoutes } from "./_components/routes/trip-route-query";
import type {
  RouteLineString,
  RouteSegment,
  RouteSegmentStatus,
} from "./_components/routes/trip-route.types";

type PlannerMapProps = {
  latitude: number;
  longitude: number;
};

type RouteFeature = {
  type: "Feature";
  properties: {
    id: string;
    status: RouteSegmentStatus;
    routeColor: string;
    fromName: string;
    toName: string;
    durationSeconds: number | null;
    distanceMeters: number | null;
  };
  geometry: RouteLineString;
};

type RouteFeatureCollection = {
  type: "FeatureCollection";
  features: RouteFeature[];
};

const DEFAULT_ROUTE_COLOR = "#1976d2";
const VIEWPORT_POI_ZOOM_MIN = 14;
const VIEWPORT_POI_RADIUS_M = 800;
const VIEWPORT_POI_REFETCH_DIST_KM = 0.35;

export function PlannerMapMapbox({ latitude, longitude }: PlannerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapRef>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const tripRoutes = useTripRoutes();
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
  const selectSearchResult = useSetAtom(selectSearchResultAtom);
  const selectEvCharger = useSetAtom(selectEvChargerAtom);
  const selectTripPlace = useSetAtom(selectTripPlaceAtom);
  const stepSearchResult = useSetAtom(stepSearchResultAtom);
  const addSelectedEvChargerToTrip = useSetAtom(addSelectedEvChargerToTripAtom);
  const addSelectedPlaceToTrip = useSetAtom(addSelectedPlaceToTripAtom);
  const closeSelectedEvCharger = useSetAtom(closeSelectedEvChargerAtom);
  const closeSelectedSearchPlace = useSetAtom(closeSelectedSearchPlaceAtom);
  const closeSelectedTripPlace = useSetAtom(closeSelectedTripPlaceAtom);
  const activeBlockId = useAtomValue(activeBlockIdAtom);
  const startPlaceSearch = useSetAtom(startPlaceSearchAtom);
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const [viewportPois, setViewportPois] = useState<PlaceSearchResult[]>([]);
  const lastPoiFetchRef = useRef<{ lat: number; lng: number } | null>(null);
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
  const routeSegments = useMemo(
    () => tripRoutes.data?.segments ?? [],
    [tripRoutes.data?.segments],
  );
  const routeGeoJson = useMemo(
    () => getRouteFeatureCollection(routeSegments, routeColorByBlockId),
    [routeColorByBlockId, routeSegments],
  );
  const routeStatusMessage = tripRoutes.isFetching
    ? "Calculating routes..."
    : tripRoutes.isError
      ? "Routes could not load."
      : null;
  const canAddToTrip = tripBlocks.length > 0;

  useEffect(() => {
    if (!isMapReady || !mapContainerRef.current) {
      return;
    }

    const mapContainer = mapContainerRef.current;
    let resizeFrame: number | null = null;

    const resizeMap = () => {
      if (resizeFrame !== null) {
        window.cancelAnimationFrame(resizeFrame);
      }

      resizeFrame = window.requestAnimationFrame(() => {
        mapRef.current?.resize();
        resizeFrame = null;
      });
    };

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(resizeMap);

    resizeObserver?.observe(mapContainer);
    window.addEventListener("resize", resizeMap);
    resizeMap();

    const transitionEndTimeout = window.setTimeout(resizeMap, 250);

    return () => {
      if (resizeFrame !== null) {
        window.cancelAnimationFrame(resizeFrame);
      }

      window.clearTimeout(transitionEndTimeout);
      window.removeEventListener("resize", resizeMap);
      resizeObserver?.disconnect();
    };
  }, [isMapReady, sidebarCollapsed]);

  useEffect(() => {
    if (!selectedPlace || !mapRef.current) {
      return;
    }

    mapRef.current.flyTo({
      center: [selectedPlace.lng, selectedPlace.lat],
      zoom: 14,
      duration: 700,
    });
  }, [selectedPlace]);

  useEffect(() => {
    if (!selectedEvChargerResult || !mapRef.current) {
      return;
    }

    mapRef.current.flyTo({
      center: [
        selectedEvChargerResult.charger.location.lng,
        selectedEvChargerResult.charger.location.lat,
      ],
      zoom: 14,
      duration: 700,
    });
  }, [selectedEvChargerResult]);

  useEffect(() => {
    if (!selectedTripPlace || !mapRef.current) {
      return;
    }

    mapRef.current.flyTo({
      center: [selectedTripPlace.lng, selectedTripPlace.lat],
      zoom: 14,
      duration: 700,
    });
  }, [selectedTripPlace]);

  const handleMoveEnd = useCallback(async () => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    const zoom = map.getZoom();
    const { lat, lng } = map.getCenter();

    if (zoom < VIEWPORT_POI_ZOOM_MIN) {
      setViewportPois([]);
      lastPoiFetchRef.current = null;
      return;
    }

    const last = lastPoiFetchRef.current;

    if (
      last &&
      getDistanceKm(last.lat, last.lng, lat, lng) < VIEWPORT_POI_REFETCH_DIST_KM
    ) {
      return;
    }

    lastPoiFetchRef.current = { lat, lng };

    try {
      const results = await fetchNearbyPlaces(lat, lng, VIEWPORT_POI_RADIUS_M);
      setViewportPois(results);
    } catch {
      // Viewport POIs are a best-effort enhancement — fail silently.
    }
  }, []);

  const handleViewportPoiClick = useCallback(
    (poi: PlaceSearchResult) => {
      const blockId = (activeBlockId || tripBlocks[0]?.id) ?? "";
      startPlaceSearch({ blockId, result: poi });
    },
    [activeBlockId, startPlaceSearch, tripBlocks],
  );

  if (!mapboxToken) {
    return (
      <div className="flex h-full items-center justify-center bg-muted p-8 text-center">
        <div className="max-w-sm rounded-sm border border-border bg-card p-5 shadow-xs">
          <p className="font-semibold text-foreground">
            Map preview unavailable
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Add a Mapbox token to show search markers and trip places.
          </p>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="flex h-full items-center justify-center bg-muted p-8 text-center">
        <div className="max-w-sm rounded-sm border border-border bg-card p-5 shadow-xs">
          <p className="font-semibold text-foreground">
            Map preview unavailable
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {mapError}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      className="relative h-full min-w-0 overflow-hidden"
    >
      <Map
        ref={mapRef}
        mapboxAccessToken={mapboxToken}
        initialViewState={{ latitude, longitude, zoom: 11 }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        onMoveEnd={handleMoveEnd}
        onLoad={() => {
          setIsMapReady(true);
          hidePOILayers(mapRef.current);
          window.requestAnimationFrame(() => mapRef.current?.resize());
        }}
        onError={(event) => {
          console.error("Planner map failed to load.", {
            component: "PlannerMapMapbox",
            operation: "mapboxLoad",
            error: event.error,
          });
          setMapError("The map could not load. Please check the Mapbox token.");
        }}
      >
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />

        {routeSegments.length ? (
          <Source id="trip-route" type="geojson" data={routeGeoJson}>
            <Layer
              id="trip-route-solid"
              type="line"
              source="trip-route"
              filter={["==", ["get", "status"], "routed"]}
              layout={{
                "line-join": "round",
                "line-cap": "round",
              }}
              paint={{
                "line-color": ["get", "routeColor"],
                "line-width": 5,
                "line-opacity": 0.9,
              }}
            />
            <Layer
              id="trip-route-fallback"
              type="line"
              source="trip-route"
              filter={["==", ["get", "status"], "fallback"]}
              layout={{
                "line-join": "round",
                "line-cap": "round",
              }}
              paint={{
                "line-color": ["get", "routeColor"],
                "line-width": 4,
                "line-opacity": 0.65,
                "line-dasharray": [2, 2],
              }}
            />
          </Source>
        ) : null}

        {selectedTripPlaceMarkers.map((place) => {
          const isSelected = selectedTripPlace?.id === place.id;
          const blockColor = getTripBlockColorById(place.blockColorId);

          return (
            <Marker
              key={place.id}
              latitude={place.lat}
              longitude={place.lng}
              anchor="bottom"
            >
              <button
                type="button"
                className="relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                aria-label={`Select saved ${place.isEvCharger ? "EV station" : "place"} ${place.name}`}
                onClick={(event) => {
                  event.stopPropagation();
                  selectTripPlace({ itemId: place.id });
                }}
              >
                <MapPin
                  className={cn(
                    "transition-all [&>circle]:hidden",
                    isSelected ? "size-12 drop-shadow-lg" : "size-8 drop-shadow-md",
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
            </Marker>
          );
        })}

        {evChargerResults.map((result) => {
          if (selectedTripPlaceIds.has(`ev-charger:${result.charger.id}`)) {
            return null;
          }

          const isSelected =
            selectedEvChargerResult?.charger.id === result.charger.id;
          const blockColor = blockColorById.get(result.targetBlockId);

          const pinFill = isSelected && blockColor
            ? blockColor.value
            : "var(--primary-foreground)";
          const pinColor = pinFill;
          const iconColor = isSelected && blockColor
            ? blockColor.foreground
            : "var(--primary)";

          return (
            <Marker
              key={result.charger.id}
              latitude={result.charger.location.lat}
              longitude={result.charger.location.lng}
              anchor="bottom"
            >
              <button
                type="button"
                aria-label={`Select EV station ${result.charger.name}`}
                onClick={(event) => {
                  event.stopPropagation();
                  selectEvCharger(result.charger.id);
                }}
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
                    color: pinColor,
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
            </Marker>
          );
        })}

        {viewportPois.map((poi) => {
          if (
            selectedTripPlaceIds.has(poi.id) ||
            activeSearch?.results.some((r) => r.providerPlaceId === poi.providerPlaceId)
          ) {
            return null;
          }

          return (
            <Marker
              key={poi.id}
              latitude={poi.lat}
              longitude={poi.lng}
              anchor="bottom"
            >
              <button
                type="button"
                title={poi.name}
                aria-label={`View ${poi.name}`}
                onClick={(event) => {
                  event.stopPropagation();
                  handleViewportPoiClick(poi);
                }}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                <MapPin
                  className="size-5 drop-shadow-sm transition-transform hover:scale-125"
                  style={{
                    color: "var(--muted-foreground)",
                    fill: "var(--card)",
                  }}
                  aria-hidden="true"
                />
              </button>
            </Marker>
          );
        })}

        {activeSearch?.results.map((place, index) => {
          if (selectedTripPlaceIds.has(place.id)) {
            return null;
          }

          const isSelected = activeSearch.selectedIndex === index;

          return (
            <Marker
              key={place.id}
              latitude={place.lat}
              longitude={place.lng}
              anchor="bottom"
            >
              <button
                type="button"
                aria-label={`Select ${place.name} result ${index + 1}`}
                onClick={(event) => {
                  event.stopPropagation();
                  selectSearchResult({ index });
                }}
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
                    color: isSelected && activeSearchColor
                      ? activeSearchColor.foreground
                      : "var(--foreground)",
                    fill: isSelected && activeSearchColor
                      ? activeSearchColor.value
                      : "var(--card)",
                  }}
                  aria-hidden="true"
                />
              </button>
            </Marker>
          );
        })}
      </Map>

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

function getRouteFeatureCollection(
  segments: RouteSegment[],
  routeColorByBlockId: globalThis.Map<string, string>,
): RouteFeatureCollection {
  return {
    type: "FeatureCollection",
    features: segments.map((segment) => ({
      type: "Feature",
      properties: {
        id: segment.id,
        status: segment.status,
        routeColor:
          routeColorByBlockId.get(segment.blockId) ?? DEFAULT_ROUTE_COLOR,
        fromName: segment.fromName,
        toName: segment.toName,
        durationSeconds: segment.durationSeconds ?? null,
        distanceMeters: segment.distanceMeters ?? null,
      },
      geometry: segment.geometry,
    })),
  };
}

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

function getDistanceKm(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
) {
  const R = 6371;
  const dLat = ((toLat - fromLat) * Math.PI) / 180;
  const dLng = ((toLng - fromLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((fromLat * Math.PI) / 180) *
      Math.cos((toLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
}

// Hides Mapbox's built-in POI icon layers so they don't compete with custom
// Google Places markers. Street labels and context remain visible.
function hidePOILayers(mapRef: MapRef | null) {
  const map = mapRef?.getMap();

  if (!map || !map.isStyleLoaded()) {
    return;
  }

  map.getStyle().layers?.forEach((layer) => {
    if (layer.id.toLowerCase().includes("poi")) {
      try {
        map.setLayoutProperty(layer.id, "visibility", "none");
      } catch {
        // Some style layers reject runtime layout edits depending on source data.
      }
    }
  });
}

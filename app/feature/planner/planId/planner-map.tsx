"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import Map, {
  FullscreenControl,
  Layer,
  type MapRef,
  Marker,
  NavigationControl,
  Source,
} from "react-map-gl/mapbox";
import { Zap } from "lucide-react";

import { cn } from "@/lib/utils";

import "mapbox-gl/dist/mapbox-gl.css";

import { getTripBlockColorById } from "./_components/constants/trip-block-colors";
import { isEvChargerPlaceItem, isPlaceItem } from "./_components/constants/types";
import type { EvCharger, TripBlockData } from "./_components/constants/types";
import { EvStationSidePanel } from "./_components/charger/ev-station-side-panel";
import {
  activeBlockIdAtom,
  activeSearchAtom,
  addEvChargerToBlockAtom,
  addSelectedPlaceToTripAtom,
  closeActiveSearchAtom,
  closeSelectedTripPlaceAtom,
  clearEvChargerResultsAtom,
  evChargerErrorAtom,
  evChargerLoadingAtom,
  evChargerResultsAtom,
  selectEvChargerAtom,
  selectedEvChargerResultAtom,
  selectedSearchPlaceAtom,
  selectedSearchPlaceIsAddedAtom,
  selectedTripPlaceAtom,
  selectedTripPlaceMarkersAtom,
  selectedTripPlacesAtom,
  selectSearchResultAtom,
  selectTripPlaceAtom,
  setEvChargerResultsAtom,
  stepSearchResultAtom,
  tripBlocksAtom,
} from "./_components/overview/trip-builder.atoms";
import { PlacePreviewPanel } from "./_components/place/place-preview-panel";
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

export function PlannerMap({ latitude, longitude }: PlannerMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const tripRoutes = useTripRoutes();
  const activeBlockId = useAtomValue(activeBlockIdAtom);
  const activeSearch = useAtomValue(activeSearchAtom);
  const tripBlocks = useAtomValue(tripBlocksAtom);
  const selectedPlace = useAtomValue(selectedSearchPlaceAtom);
  const selectedTripPlace = useAtomValue(selectedTripPlaceAtom);
  const selectedTripPlaces = useAtomValue(selectedTripPlacesAtom);
  const selectedTripPlaceMarkers = useAtomValue(selectedTripPlaceMarkersAtom);
  const evChargerResults = useAtomValue(evChargerResultsAtom);
  const selectedEvChargerResult = useAtomValue(selectedEvChargerResultAtom);
  const isLoadingEvChargers = useAtomValue(evChargerLoadingAtom);
  const evChargerError = useAtomValue(evChargerErrorAtom);
  const isSelectedPlaceAdded = useAtomValue(selectedSearchPlaceIsAddedAtom);
  const selectSearchResult = useSetAtom(selectSearchResultAtom);
  const selectEvCharger = useSetAtom(selectEvChargerAtom);
  const selectTripPlace = useSetAtom(selectTripPlaceAtom);
  const stepSearchResult = useSetAtom(stepSearchResultAtom);
  const addSelectedPlaceToTrip = useSetAtom(addSelectedPlaceToTripAtom);
  const addEvChargerToBlock = useSetAtom(addEvChargerToBlockAtom);
  const closeActiveSearch = useSetAtom(closeActiveSearchAtom);
  const clearEvChargerResults = useSetAtom(clearEvChargerResultsAtom);
  const closeSelectedTripPlace = useSetAtom(closeSelectedTripPlaceAtom);
  const setEvChargerResults = useSetAtom(setEvChargerResultsAtom);
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const selectedTripPlaceIds = useMemo(
    () => new Set(selectedTripPlaces.map((place) => place.placeId)),
    [selectedTripPlaces],
  );
  const addedChargerIds = useMemo(
    () =>
      new Set(
        selectedTripPlaces
          .map((place) => place.placeId)
          .filter((placeId) => placeId.startsWith("ev-charger:"))
          .map((placeId) => placeId.replace("ev-charger:", "")),
      ),
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

  const evPanelBlockId =
    evChargerResults[0]?.targetBlockId ?? activeBlockId ?? null;
  const evPanelPlaceAnchors = useMemo(() => {
    if (!evPanelBlockId) return [];
    const block = tripBlocks.find((b) => b.id === evPanelBlockId);
    if (!block) return [];
    return block.items
      .filter(isPlaceItem)
      .filter((item) => !isEvChargerPlaceItem(item))
      .map((item) => ({ id: item.id, lat: item.lat, lng: item.lng }));
  }, [evPanelBlockId, tripBlocks]);

  function addChargerToTrip(blockId: string, charger: EvCharger) {
    addEvChargerToBlock({ blockId, charger });
  }

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
    <div className="relative h-full">
      <Map
        ref={mapRef}
        mapboxAccessToken={mapboxToken}
        initialViewState={{ latitude, longitude, zoom: 11 }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        onError={(event) => {
          console.error("Planner map failed to load.", {
            component: "PlannerMap",
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
          const markerStyle: CSSProperties = {
            backgroundColor: blockColor.value,
            color: blockColor.foreground,
          };
          const stemStyle: CSSProperties = {
            backgroundColor: blockColor.value,
          };

          return (
            <Marker
              key={place.id}
              latitude={place.lat}
              longitude={place.lng}
              anchor="bottom"
            >
              <button
                type="button"
                className="flex flex-col items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                aria-label={`Select saved ${place.isEvCharger ? "EV station" : "place"} ${place.name}`}
                onClick={() => selectTripPlace({ itemId: place.id })}
              >
                <div
                  className={cn(
                    "flex items-center justify-center rounded-full text-xs font-bold shadow-md ring-2 ring-background transition-all",
                    isSelected ? "size-10" : "size-7",
                  )}
                  style={markerStyle}
                >
                  {place.isEvCharger ? (
                    <Zap
                      className={isSelected ? "size-5" : "size-3.5"}
                      aria-hidden="true"
                    />
                  ) : (
                    place.placeSequence
                  )}
                </div>
                <div
                  className="h-2 w-0.5 opacity-70"
                  style={stemStyle}
                  aria-hidden="true"
                />
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
          const selectedMarkerStyle: CSSProperties | undefined = blockColor
            ? {
                backgroundColor: blockColor.value,
                color: blockColor.foreground,
              }
            : undefined;
          const selectedStemStyle: CSSProperties | undefined = blockColor
            ? { backgroundColor: blockColor.value }
            : undefined;

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
                onClick={() => selectEvCharger(result.charger.id)}
                className="flex flex-col items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                <span
                  className={cn(
                    "flex items-center justify-center rounded-full shadow-lg ring-2 ring-background transition-all",
                    isSelected
                      ? "size-10"
                      : "size-8 bg-card text-primary hover:bg-primary/10",
                  )}
                  style={isSelected ? selectedMarkerStyle : undefined}
                >
                  <Zap
                    className={isSelected ? "size-5" : "size-4"}
                    aria-hidden="true"
                  />
                </span>
                <span
                  className={cn(
                    "h-2 w-0.5",
                    isSelected ? "bg-primary" : "bg-primary/50",
                  )}
                  style={isSelected ? selectedStemStyle : undefined}
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
          const selectedMarkerStyle: CSSProperties | undefined =
            activeSearchColor
              ? {
                  backgroundColor: activeSearchColor.value,
                  color: activeSearchColor.foreground,
                }
              : undefined;
          const selectedStemStyle: CSSProperties | undefined = activeSearchColor
            ? { backgroundColor: activeSearchColor.value }
            : undefined;

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
                onClick={() => selectSearchResult({ index })}
                className="flex flex-col items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                <span
                  className={cn(
                    "flex items-center justify-center rounded-full text-xs font-bold shadow-lg ring-2 ring-background transition-all",
                    isSelected
                      ? "size-10"
                      : "size-8 bg-card text-foreground hover:bg-muted",
                  )}
                  style={isSelected ? selectedMarkerStyle : undefined}
                >
                  {index + 1}
                </span>
                <span
                  className={cn(
                    "h-2 w-0.5",
                    isSelected ? "bg-primary" : "bg-foreground/40",
                  )}
                  style={isSelected ? selectedStemStyle : undefined}
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
          onPrevious={() => stepSearchResult({ direction: "previous" })}
          onNext={() => stepSearchResult({ direction: "next" })}
          onAddToTrip={() => addSelectedPlaceToTrip()}
          onClose={() => closeActiveSearch()}
        />
      ) : selectedTripPlace ? (
        <TripPlacePreviewPanel
          place={selectedTripPlace}
          onClose={() => closeSelectedTripPlace()}
        />
      ) : null}

      {evChargerResults.length ? (
        <EvStationSidePanel
          activeBlockId={activeBlockId}
          placeAnchors={evPanelPlaceAnchors}
          results={evChargerResults}
          selectedResult={selectedEvChargerResult}
          addedChargerIds={addedChargerIds}
          onAddCharger={addChargerToTrip}
          onClose={() => clearEvChargerResults()}
          onSelect={(chargerId) => selectEvCharger(chargerId)}
          onUpdateResults={(results) => setEvChargerResults(results)}
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

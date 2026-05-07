"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import Map, {
  FullscreenControl,
  type MapRef,
  Marker,
  NavigationControl,
} from "react-map-gl/mapbox";
import { MapPin, Zap } from "lucide-react";

import { cn } from "@/lib/utils";

import "mapbox-gl/dist/mapbox-gl.css";

import { getEvChargersNear } from "./data";
import { ChargerPreviewPanel } from "./charger-preview-panel";
import {
  activeSearchAtom,
  addSelectedEvChargerToTripAtom,
  addSelectedPlaceToTripAtom,
  clearEvChargerResultsAtom,
  closeActiveSearchAtom,
  closeSelectedTripPlaceAtom,
  closeSelectedEvChargerAtom,
  dedupeEvChargerResults,
  evChargerErrorAtom,
  evChargerLoadingAtom,
  evChargerResultsAtom,
  selectEvChargerAtom,
  selectedEvChargerIsAddedAtom,
  selectedEvChargerResultAtom,
  selectedSearchPlaceAtom,
  selectedSearchPlaceIsAddedAtom,
  selectedTripPlaceAtom,
  selectedTripPlaceAnchorsAtom,
  selectedTripPlacesAtom,
  selectSearchResultAtom,
  setEvChargerResultsAtom,
  stepSearchResultAtom,
} from "./trip-builder.atoms";
import { PlacePreviewPanel } from "./place-preview-panel";
import { TripPlacePreviewPanel } from "./trip-place-preview-panel";

type PlannerMapProps = {
  latitude: number;
  longitude: number;
};

export function PlannerMap({ latitude, longitude }: PlannerMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const activeSearch = useAtomValue(activeSearchAtom);
  const selectedPlace = useAtomValue(selectedSearchPlaceAtom);
  const selectedTripPlace = useAtomValue(selectedTripPlaceAtom);
  const selectedTripPlaces = useAtomValue(selectedTripPlacesAtom);
  const selectedTripPlaceAnchors = useAtomValue(selectedTripPlaceAnchorsAtom);
  const evChargerResults = useAtomValue(evChargerResultsAtom);
  const selectedEvChargerResult = useAtomValue(selectedEvChargerResultAtom);
  const isSelectedEvChargerAdded = useAtomValue(selectedEvChargerIsAddedAtom);
  const isLoadingEvChargers = useAtomValue(evChargerLoadingAtom);
  const evChargerError = useAtomValue(evChargerErrorAtom);
  const isSelectedPlaceAdded = useAtomValue(selectedSearchPlaceIsAddedAtom);
  const selectSearchResult = useSetAtom(selectSearchResultAtom);
  const selectEvCharger = useSetAtom(selectEvChargerAtom);
  const stepSearchResult = useSetAtom(stepSearchResultAtom);
  const addSelectedPlaceToTrip = useSetAtom(addSelectedPlaceToTripAtom);
  const addSelectedEvChargerToTrip = useSetAtom(addSelectedEvChargerToTripAtom);
  const closeActiveSearch = useSetAtom(closeActiveSearchAtom);
  const closeSelectedEvCharger = useSetAtom(closeSelectedEvChargerAtom);
  const closeSelectedTripPlace = useSetAtom(closeSelectedTripPlaceAtom);
  const setEvChargerResults = useSetAtom(setEvChargerResultsAtom);
  const clearEvChargerResults = useSetAtom(clearEvChargerResultsAtom);
  const setEvChargerLoading = useSetAtom(evChargerLoadingAtom);
  const setEvChargerError = useSetAtom(evChargerErrorAtom);
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const selectedTripPlaceIds = useMemo(
    () => new Set(selectedTripPlaces.map((place) => place.placeId)),
    [selectedTripPlaces],
  );

  useEffect(() => {
    let isCancelled = false;

    if (selectedTripPlaceAnchors.length < 2) {
      clearEvChargerResults();
      return;
    }

    async function fetchEvChargers() {
      setEvChargerLoading(true);
      setEvChargerError(null);

      try {
        const chargersByAnchor = await Promise.all(
          selectedTripPlaceAnchors.map(async (anchor) => {
            const list = await getEvChargersNear({
              lat: anchor.lat,
              lng: anchor.lng,
              radiusKm: 8,
            });

            return {
              anchor,
              chargers: list.items,
            };
          }),
        );

        if (isCancelled) {
          return;
        }

        setEvChargerResults(dedupeEvChargerResults(chargersByAnchor));
      } catch (error) {
        if (isCancelled) {
          return;
        }

        console.error("EV chargers failed to load.", {
          component: "PlannerMap",
          operation: "loadEvChargers",
          error,
        });
        setEvChargerResults([]);
        setEvChargerError("EV charging stations could not load.");
      } finally {
        if (!isCancelled) {
          setEvChargerLoading(false);
        }
      }
    }

    fetchEvChargers();

    return () => {
      isCancelled = true;
    };
  }, [
    clearEvChargerResults,
    selectedTripPlaceAnchors,
    setEvChargerError,
    setEvChargerLoading,
    setEvChargerResults,
  ]);

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
          <p className="font-semibold text-foreground">Map preview unavailable</p>
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
          <p className="font-semibold text-foreground">Map preview unavailable</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{mapError}</p>
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
        mapStyle="mapbox://styles/mapbox/light-v11"
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

        {selectedTripPlaces.map((place) => {
          const isSelected = selectedTripPlace?.id === place.id;

          return (
            <Marker
              key={place.id}
              latitude={place.lat}
              longitude={place.lng}
              anchor="bottom"
            >
              <div
                className="flex flex-col items-center"
                role="img"
                aria-label={`${place.name} added to trip`}
              >
                <div
                  className={cn(
                    "flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-background transition-all",
                    isSelected ? "size-10" : "size-7",
                  )}
                >
                  <MapPin className={isSelected ? "size-5" : "size-3.5"} aria-hidden="true" />
                </div>
                <div className="h-2 w-0.5 bg-primary/60" aria-hidden="true" />
              </div>
            </Marker>
          );
        })}

        {evChargerResults.map((result) => {
          const isSelected =
            selectedEvChargerResult?.charger.id === result.charger.id;

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
                      ? "size-10 bg-primary text-primary-foreground"
                      : "size-8 bg-card text-primary hover:bg-primary/10",
                  )}
                >
                  <Zap className={isSelected ? "size-5" : "size-4"} aria-hidden="true" />
                </span>
                <span
                  className={cn(
                    "h-2 w-0.5",
                    isSelected ? "bg-primary" : "bg-primary/50",
                  )}
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
                onClick={() => selectSearchResult({ index })}
                className="flex flex-col items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                <span
                  className={cn(
                    "flex items-center justify-center rounded-full text-xs font-bold shadow-lg ring-2 ring-background transition-all",
                    isSelected
                      ? "size-10 bg-primary text-primary-foreground"
                      : "size-8 bg-card text-foreground hover:bg-muted",
                  )}
                >
                  {index + 1}
                </span>
                <span
                  className={cn(
                    "h-2 w-0.5",
                    isSelected ? "bg-primary" : "bg-foreground/40",
                  )}
                  aria-hidden="true"
                />
              </button>
            </Marker>
          );
        })}
      </Map>

      {selectedTripPlaceAnchors.length >= 2 &&
      (isLoadingEvChargers || evChargerError) ? (
        <div className="absolute left-4 top-4 z-10 rounded-sm border border-border bg-card px-3 py-2 text-xs font-medium text-card-foreground shadow-md">
          {isLoadingEvChargers ? "Loading EV stations..." : evChargerError}
        </div>
      ) : null}

      {selectedEvChargerResult ? (
        <ChargerPreviewPanel
          result={selectedEvChargerResult}
          isAdded={isSelectedEvChargerAdded}
          onAddToTrip={() => addSelectedEvChargerToTrip()}
          onClose={() => closeSelectedEvCharger()}
        />
      ) : activeSearch && selectedPlace ? (
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
    </div>
  );
}

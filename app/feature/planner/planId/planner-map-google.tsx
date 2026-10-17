"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  APIProvider,
  type MapMouseEvent,
  useMap,
} from "@vis.gl/react-google-maps";
import { MapPin, Zap } from "lucide-react";
import { AppearanceGoogleMap as Map } from "@/components/map/appearance-google-map";
import { AppearanceGoogleMarker as MapMarker } from "@/components/map/appearance-google-marker";

import { TripLocationPin } from "./_components/itinerary/trip-location-pin";
import { buildTripLocationMarkers, orderVisitsForActiveBlock } from "./_components/itinerary/trip-location-markers";
import { useTripLocationSelection } from "./_components/itinerary/use-trip-location-selection";
import { useRevealPlanCard } from "./_components/itinerary/use-reveal-plan-card";
import { focusedAnchorAtom } from "./_components/itinerary/anchor-map.atoms";
import { sidebarCollapsedAtom } from "@/app/configs/constant";
import { cn } from "@/lib/utils";

import { ChargerPreviewPanel } from "./_components/charger/charger-preview-panel";
import { useTripBlockColorResolver } from "./_components/constants/use-trip-block-color";
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
  visibleEvChargerResultsAtom,
  selectEvChargerAtom,
  selectedEvChargerIsAddedAtom,
  selectedEvChargerResultAtom,
  selectedSearchPlaceAtom,
  selectedSearchPlaceUsageAtom,
  selectedSearchPlaceInsertionAtom,
  selectedEvChargerInsertionAtom,
  selectedTripPlaceAtom,
  selectedTripPlacesAtom,
  selectSearchResultAtom,
  plannerReadOnlyAtom,
  startPlaceSearchAtom,
  stepSearchResultAtom,
  tripBlocksAtom,
} from "./_components/overview/trip-builder.atoms";
import { GuideMapMarkers } from "./_components/guide/guide-map-markers";
import {
  addGuidePlaceToDayAtom,
  guideBrowseAtom,
  selectedGuidePlaceIdAtom,
  visibleGuidePlaceIdsAtom,
} from "./_components/guide/guide.atoms";
import { PlacePreviewPanel } from "./_components/place/place-preview-panel";
import { usePlaceDetails } from "./_components/place/use-place-details";
import { fetchNearbyPlaces, fetchPlaceDetail } from "./_components/place/place-api";
import { TripPlacePreviewPanel } from "./_components/place/trip-place-preview-panel";
import { GoogleMapsExportButton } from "./_components/routes/google-maps-export-button";
import { TransitDataAttribution } from "./_components/routes/transit-data-attribution";
import {
  GoogleRouteLegCamera,
  GoogleRoutePolylines,
  GoogleTransitLayer,
  TransitLinesToggle,
  transitLinesVisibleAtom,
} from "./_components/routes/google-route-layers";
import { isVisitOnSegment } from "./_components/routes/route-focus";
import {
  nearestTransitStation,
  stationHitRadiusMeters,
} from "./_components/routes/transit-station-click";
import { useTripRoutes } from "./_components/routes/trip-route-query";
import { useVisibleRoutes } from "./_components/routes/use-visible-routes";
import { getTransitStopMarkers } from "./_components/routes/transit-journey.helpers";
import { TransitStopPin } from "./_components/routes/transit-stop-pin";

// --- Types ---

type PlannerMapGoogleProps = {
  latitude: number;
  longitude: number;
};

type LatLng = { lat: number; lng: number };

type MapControllerProps = {
  selectedPlaceCoord: LatLng | null;
  evChargerCoord: LatLng | null;
  tripPlaceCoord: LatLng | null;
  anchorCoord: LatLng | null;
};

type MapResizeHandlerProps = {
  sidebarCollapsed: boolean;
};

// --- Constants ---

const FLY_TO_ZOOM = 14;

// --- Child map components (must be inside <Map>) ---

function MapController({
  selectedPlaceCoord,
  evChargerCoord,
  tripPlaceCoord,
  anchorCoord,
}: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || !anchorCoord) return;
    map.panTo(anchorCoord);
    map.setZoom(FLY_TO_ZOOM);
  }, [map, anchorCoord]);

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
  const resolveColor = useTripBlockColorResolver();
  return useMemo(() => {
    const map = new globalThis.Map<string, string>();
    tripBlocks.forEach((block) => {
      const blockColor = resolveColor(block.colorId);
      map.set(block.id, blockColor.mapColor);
    });
    return map;
  }, [tripBlocks, resolveColor]);
}

// --- Main component ---

export function PlannerMapGoogle({ latitude, longitude }: PlannerMapGoogleProps) {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const sidebarCollapsed = useAtomValue(sidebarCollapsedAtom);
  const activeSearch = useAtomValue(activeSearchAtom);
  const tripBlocks = useAtomValue(tripBlocksAtom);
  const focusedAnchor = useAtomValue(focusedAnchorAtom);
  const selectedPlace = useAtomValue(selectedSearchPlaceAtom);
  const selectedTripPlace = useAtomValue(selectedTripPlaceAtom);
  const selectedTripPlaces = useAtomValue(selectedTripPlacesAtom);
  const locationMarkers = useMemo(() => buildTripLocationMarkers(tripBlocks), [tripBlocks]);
  const activeEvCar = useAtomValue(activeEvCarAtom);
  const evChargerResults = useAtomValue(visibleEvChargerResultsAtom);
  const selectedEvChargerResult = useAtomValue(selectedEvChargerResultAtom);
  const selectedEvChargerIsAdded = useAtomValue(selectedEvChargerIsAddedAtom);
  const isLoadingEvChargers = useAtomValue(evChargerLoadingAtom);
  const evChargerError = useAtomValue(evChargerErrorAtom);
  const selectedPlaceUsage = useAtomValue(selectedSearchPlaceUsageAtom);
  const selectedPlaceInsertion = useAtomValue(selectedSearchPlaceInsertionAtom);
  const selectedChargerInsertion = useAtomValue(selectedEvChargerInsertionAtom);
  const activeBlockId = useAtomValue(activeBlockIdAtom);
  const selectLocationVisit = useTripLocationSelection();
  const revealPlanCard = useRevealPlanCard();
  const selectSearchResult = useSetAtom(selectSearchResultAtom);
  const selectEvCharger = useSetAtom(selectEvChargerAtom);
  const stepSearchResult = useSetAtom(stepSearchResultAtom);
  const addSelectedEvChargerToTrip = useSetAtom(addSelectedEvChargerToTripAtom);
  const addSelectedPlaceToTrip = useSetAtom(addSelectedPlaceToTripAtom);
  const closeSelectedEvCharger = useSetAtom(closeSelectedEvChargerAtom);
  const closeSelectedSearchPlace = useSetAtom(closeSelectedSearchPlaceAtom);
  const closeSelectedTripPlace = useSetAtom(closeSelectedTripPlaceAtom);
  const startPlaceSearch = useSetAtom(startPlaceSearchAtom);
  const readOnly = useAtomValue(plannerReadOnlyAtom);
  const transitLinesVisible = useAtomValue(transitLinesVisibleAtom);
  const isBrowsingGuide = useAtomValue(guideBrowseAtom) !== null;
  const guidePlaceIds = useAtomValue(visibleGuidePlaceIdsAtom);
  const selectedGuidePlaceId = useAtomValue(selectedGuidePlaceIdAtom);
  // Guide places carry no photo or rating of their own; the preview loads them live.
  const guidePlaceDetails = usePlaceDetails(selectedGuidePlaceId ?? "");
  const addGuidePlaceToDay = useSetAtom(addGuidePlaceToDayAtom);

  const selectedTripPlaceIds = useMemo(
    () => new Set(selectedTripPlaces.map((place) => place.placeId)),
    [selectedTripPlaces],
  );
  const resolveBlockColor = useTripBlockColorResolver();
  const blockColorById = useMemo(
    () =>
      new globalThis.Map(
        tripBlocks.map((block) => [
          block.id,
          resolveBlockColor(block.colorId),
        ]),
      ),
    [tripBlocks, resolveBlockColor],
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
  const visibleRoutes = useVisibleRoutes(routeSegments);
  const focusedSegment = visibleRoutes.focusedSegment;
  // The camera stays on a place, charger or search result being inspected.
  const followsFocusedLeg = !isBrowsingGuide && !selectedTripPlace && !selectedPlace && !selectedEvChargerResult;
  // While browsing a guide, the plan's routes and pins step back behind the guide's pins.
  const drawnRouteSegments = isBrowsingGuide ? [] : visibleRoutes.segments;
  const previewPlace = selectedPlace && selectedGuidePlaceId && guidePlaceDetails.data
    ? {
        ...selectedPlace,
        imageUrl: guidePlaceDetails.data.imageUrl,
        rating: guidePlaceDetails.data.rating,
        reviewCount: guidePlaceDetails.data.reviewCount,
        openingHours: guidePlaceDetails.data.openingHours,
        phone: guidePlaceDetails.data.phone,
        website: guidePlaceDetails.data.website,
      }
    : selectedPlace;
  const routeStatusMessage = !visibleRoutes.hasScope
    ? null
    : tripRoutes.isFetching
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
      if (readOnly) return;
      const { placeId, latLng } = event.detail;
      // The transit overlay hides station click targets, so look the station up by position.
      const stationRadius =
        !placeId && transitLinesVisible && latLng
          ? stationHitRadiusMeters(latLng.lat, event.map.getZoom() ?? 0)
          : null;
      if (!placeId && stationRadius === null) return;
      if (placeId) event.stop();

      try {
        const place = placeId
          ? await fetchPlaceDetail(placeId, "GOOGLE")
          : latLng && stationRadius !== null
            ? nearestTransitStation(await fetchNearbyPlaces(latLng.lat, latLng.lng, stationRadius))
            : null;
        if (!place) return;
        const blockId = (activeBlockId || tripBlocks[0]?.id) ?? "";
        startPlaceSearch({ blockId, result: place });
      } catch (error) {
        // A failed lookup leaves the map as it was; there is nothing for the user to retry.
        console.warn("PlannerMapGoogle: map place click lookup failed", error);
      }
    },
    [activeBlockId, readOnly, startPlaceSearch, transitLinesVisible, tripBlocks],
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
          gestureHandling="greedy"
          clickableIcons={!readOnly}
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
            anchorCoord={focusedAnchor}
          />
          <MapResizeHandler sidebarCollapsed={sidebarCollapsed} />
          <GoogleTransitLayer />
          <GoogleRoutePolylines
            segments={drawnRouteSegments}
            routeColorByBlockId={routeColorByBlockId}
            focusedSegmentId={focusedSegment?.id ?? null}
          />
          <GoogleRouteLegCamera segment={focusedSegment} enabled={followsFocusedLeg} />

          {locationMarkers.map(({ key, lat, lng, visits }) => {
            const ordered = orderVisitsForActiveBlock(visits, activeBlockId, selectedTripPlace?.id);
            const isLegEnd = focusedSegment ? visits.some((visit) => isVisitOnSegment(visit, focusedSegment)) : false;
            return (
              <MapMarker key={key} position={{ lat, lng }} zIndex={isLegEnd ? 22 : ordered[0]?.blockId === activeBlockId ? 21 : 20}>
                <TripLocationPin visits={ordered} selectedItemId={selectedTripPlace?.id} dimmed={isBrowsingGuide || (Boolean(focusedSegment) && !isLegEnd)} onSelect={selectLocationVisit} />
              </MapMarker>
            );
          })}
          {getTransitStopMarkers(drawnRouteSegments).map((stop) => <MapMarker key={stop.id} position={{ lat: stop.coordinate[1], lng: stop.coordinate[0] }} zIndex={18}><TransitStopPin stop={stop} /></MapMarker>)}

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
              <MapMarker
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
                      filter: "var(--map-marker-shadow)",
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
              </MapMarker>
            );
          })}

          {/* Search result markers */}
          {activeSearch?.results.map((place, index) => {
            if (selectedTripPlaceIds.has(place.id) || guidePlaceIds.has(place.id)) return null;

            const isSelected = activeSearch.selectedIndex === index;

            return (
              <MapMarker
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
              </MapMarker>
            );
          })}
          {isBrowsingGuide && <GuideMapMarkers />}
        </Map>
      </APIProvider>

      <div className="absolute left-4 top-4 z-10 flex flex-wrap items-start gap-2">
        <GoogleMapsExportButton blocks={tripBlocks} />
        <TransitLinesToggle />
      </div>

      <TransitDataAttribution segments={drawnRouteSegments} />

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

      {activeSearch && previewPlace ? (
        <PlacePreviewPanel
          place={previewPlace}
          isLoadingDetails={Boolean(selectedGuidePlaceId) && guidePlaceDetails.isLoading}
          currentIndex={activeSearch.selectedIndex}
          total={activeSearch.results.length}
          isAdded={selectedPlaceUsage.isAdded}
          usageLabel={selectedPlaceUsage.label}
          targetLabel={selectedPlaceUsage.targetLabel}
          insertionLabel={selectedPlaceInsertion.label}
          addUnavailableReason={selectedPlaceInsertion.error}
          canAddToTrip={canAddToTrip && selectedPlaceInsertion.isValid}
          onPrevious={() => stepSearchResult({ direction: "previous" })}
          onNext={() => stepSearchResult({ direction: "next" })}
          onAddToTrip={() => {
            // The plan is hidden while browsing, so the guide keeps focus instead of scrolling to the new card.
            if (selectedGuidePlaceId) {
              addGuidePlaceToDay({ blockId: activeSearch.blockId, place: previewPlace });
              return;
            }
            const itemId = addSelectedPlaceToTrip();
            if (itemId) revealPlanCard(activeSearch.blockId, itemId);
          }}
          onClose={() => closeSelectedSearchPlace()}
        />
      ) : selectedEvChargerResult ? (
        <ChargerPreviewPanel
          result={selectedEvChargerResult}
          insertionLabel={selectedChargerInsertion.label}
          addUnavailableReason={selectedChargerInsertion.error}
          canAddToTrip={selectedChargerInsertion.isValid}
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

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { APIProvider, useMap, type MapMouseEvent } from "@vis.gl/react-google-maps";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Check, ChevronDown, MapPinned, Plus } from "lucide-react";

import { AppearanceGoogleMap } from "@/components/map/appearance-google-map";
import { AppearanceGoogleMarker } from "@/components/map/appearance-google-marker";
import { NumberedMapPin } from "@/components/map/numbered-map-pin";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { getTripBlockColorById } from "../../../../planner/planId/_components/constants/trip-block-colors";
import { fetchPlaceDetail } from "../../../../planner/planId/_components/place/place-api";
import { PlacePreviewPanel } from "../../../../planner/planId/_components/place/place-preview-panel";
import { usePlaceDetails } from "../../../../planner/planId/_components/place/use-place-details";
import { CategoryIcon } from "../category-icon";
import { findCategory, placeKey, sectionHasPlace, type Guide, type GuideCategory, type GuidePlace, type OutlineSection } from "../guide-model";
import { activeGuideListAtom, guidePlaceCandidateAtom, selectedGuidePlaceAtom } from "../guides.atoms";
import { useGuideEditor } from "./guide-editor-context";
import { ADD_PLACE_ERRORS, useAddGuidePlace } from "./use-add-guide-place";

const FIT_PADDING_PX = 56;
const FOCUS_ZOOM = 15;

type MapPlace = { sectionIndex: number; key: string; number: number; place: GuidePlace; category: GuideCategory | null };

function useMapPlaces(guide: Guide, sections: readonly OutlineSection[]): MapPlace[] {
  return useMemo(
    () =>
      sections.flatMap((section, sectionIndex) => {
        const category = findCategory(guide, section.categoryId);
        return section.places.map((entry) => ({ sectionIndex, key: entry.key, number: entry.number, place: entry.place, category }));
      }),
    [guide, sections],
  );
}

/** Every card in the text as a pin numbered like it; click any place on the map to add it to a list. */
export function GuideMap() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const { guide, sections } = useGuideEditor("GuideMap");
  const places = useMapPlaces(guide, sections);

  if (!apiKey) {
    return (
      <div className="flex h-full items-center justify-center bg-muted p-8 text-center">
        <div className="flex max-w-sm flex-col items-center gap-2">
          <MapPinned aria-hidden="true" className="size-6 text-muted-foreground" />
          <p className="font-semibold">Map unavailable</p>
          <p className="text-sm text-muted-foreground">You can keep writing and search for places in each list.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative size-full overflow-hidden">
      <APIProvider apiKey={apiKey}>
        <GuideGoogleMap guide={guide} places={places} />
      </APIProvider>
      <MapLegend guide={guide} sections={sections} />
      <MapPreview guide={guide} sections={sections} />
    </div>
  );
}

function GuideGoogleMap({ guide, places }: { guide: Guide; places: readonly MapPlace[] }) {
  const setCandidate = useSetAtom(guidePlaceCandidateAtom);
  const setSelected = useSetAtom(selectedGuidePlaceAtom);
  const activeListId = useAtomValue(activeGuideListAtom);
  const { sections } = useGuideEditor("GuideGoogleMap");
  const firstListId = sections.find((section) => section.listId)?.listId ?? null;
  const targetListId = activeListId && sections.some((section) => section.listId === activeListId) ? activeListId : firstListId;

  // As in the planner: a place's own label opens it, ready to add.
  const handleClick = useCallback(
    async (event: MapMouseEvent) => {
      const { placeId } = event.detail;
      if (!placeId) return;
      event.stop();
      try {
        const place = await fetchPlaceDetail(placeId, "GOOGLE");
        setSelected(null);
        setCandidate({ listId: targetListId, place, from: "map" });
      } catch (error) {
        console.warn("GuideMap: map place click lookup failed", { component: "GuideMap", operation: "fetchPlaceDetail", placeId, error });
      }
    },
    [setCandidate, setSelected, targetListId],
  );

  return (
    <AppearanceGoogleMap
      defaultCenter={{ lat: guide.destination.lat, lng: guide.destination.lng }}
      defaultZoom={12}
      gestureHandling="greedy"
      mapTypeControl={false}
      streetViewControl={false}
      fullscreenControl={false}
      onClick={handleClick}
      style={{ width: "100%", height: "100%" }}
    >
      <FitGuideOnOpen guideId={guide.id} places={places} />
      <FollowSelection places={places} />
      <PlacePins places={places} />
      <CandidatePin guide={guide} />
    </AppearanceGoogleMap>
  );
}

function FitGuideOnOpen({ guideId, places }: { guideId: string; places: readonly MapPlace[] }) {
  const map = useMap();
  const fittedFor = useRef<string | null>(null);

  useEffect(() => {
    // Frame every place once per guide; later edits must not move the map under the writer.
    if (!map || fittedFor.current === guideId || !places.length || typeof google === "undefined") return;
    const bounds = new google.maps.LatLngBounds();
    places.forEach(({ place }) => bounds.extend({ lat: place.lat, lng: place.lng }));
    map.fitBounds(bounds, FIT_PADDING_PX);
    fittedFor.current = guideId;
  }, [guideId, map, places]);

  return null;
}

function FollowSelection({ places }: { places: readonly MapPlace[] }) {
  const map = useMap();
  const selected = useAtomValue(selectedGuidePlaceAtom);
  const candidate = useAtomValue(guidePlaceCandidateAtom);
  const selectedPlace = places.find((entry) => entry.key === selected?.key)?.place;
  // A place clicked on the map is already in view.
  const target = candidate?.from === "search" ? candidate.place : candidate ? null : selectedPlace;
  const lat = target?.lat;
  const lng = target?.lng;

  useEffect(() => {
    if (!map || lat === undefined || lng === undefined) return;
    map.panTo({ lat, lng });
    if ((map.getZoom() ?? 0) < FOCUS_ZOOM - 2) map.setZoom(FOCUS_ZOOM);
  }, [lat, lng, map]);

  return null;
}

function PlacePins({ places }: { places: readonly MapPlace[] }) {
  const [selected, setSelected] = useAtom(selectedGuidePlaceAtom);
  const setCandidate = useSetAtom(guidePlaceCandidateAtom);
  return places.map(({ sectionIndex, key, number, place, category }) => {
    const isSelected = selected?.key === key;
    const color = getTripBlockColorById(category?.colorId ?? "slate");
    return (
      <AppearanceGoogleMarker key={`${sectionIndex}:${key}`} position={{ lat: place.lat, lng: place.lng }} zIndex={isSelected ? 30 : 20}>
        <NumberedMapPin
          color={color.value}
          foreground={color.foreground}
          label={`${category?.name ?? "Place"} ${number}: ${place.name}`}
          selected={isSelected}
          onSelect={() => {
            setCandidate(null);
            setSelected({ key, from: "map" });
          }}
        >
          {number}
        </NumberedMapPin>
      </AppearanceGoogleMarker>
    );
  });
}

function CandidatePin({ guide }: { guide: Guide }) {
  const candidate = useAtomValue(guidePlaceCandidateAtom);
  if (!candidate) return null;
  const category = findCategory(guide, candidate.listId ? (guide.lists[candidate.listId]?.categoryId ?? null) : null);
  const color = getTripBlockColorById(category?.colorId ?? "slate");
  return (
    <AppearanceGoogleMarker position={{ lat: candidate.place.lat, lng: candidate.place.lng }} zIndex={40}>
      <NumberedMapPin color={color.value} foreground={color.foreground} label={`${candidate.place.name}, not added yet`} selected pending onSelect={() => undefined}>
        <Plus aria-hidden="true" strokeWidth={3} />
      </NumberedMapPin>
    </AppearanceGoogleMarker>
  );
}

function MapLegend({ guide, sections }: { guide: Guide; sections: readonly OutlineSection[] }) {
  const rows = sections.flatMap((section, index) => {
    const category = findCategory(guide, section.categoryId);
    return category ? [{ index, category, count: section.places.length }] : [];
  });
  if (!rows.length) return null;
  return (
    <div className="absolute top-3 left-3 z-10 max-w-[calc(100%-1.5rem)] rounded-xl bg-card/95 p-2 shadow-md ring-1 ring-foreground/10 backdrop-blur-sm">
      <p className="sr-only">Map key</p>
      <ul className="flex flex-col gap-1">
        {rows.map(({ index, category, count }) => (
          <li key={index} className="flex items-center gap-2 pr-1 text-xs font-medium">
            <CategoryIcon category={category} size="sm" />
            <span className="min-w-0 flex-1 truncate">{category.name}</span>
            <span className="font-mono tabular-nums text-muted-foreground">{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The planner's place preview: for the place picked on the map, or the one about to be added. */
function MapPreview({ guide, sections }: { guide: Guide; sections: readonly OutlineSection[] }) {
  const [selected, setSelected] = useAtom(selectedGuidePlaceAtom);
  const [candidate, setCandidate] = useAtom(guidePlaceCandidateAtom);
  const setActiveList = useSetAtom(activeGuideListAtom);
  const addPlace = useAddGuidePlace();
  // An error belongs to the place it was raised for; another place starts clean.
  const [failure, setFailure] = useState<{ candidate: typeof candidate; message: string } | null>(null);
  const addError = failure && failure.candidate === candidate ? failure.message : null;
  const selectedPlace = selected ? guide.places[selected.key] : undefined;
  const details = usePlaceDetails(candidate ? "" : (selectedPlace?.id ?? ""));

  if (candidate) {
    const lists = sections.flatMap((section) => (section.listId ? [{ listId: section.listId, category: findCategory(guide, section.categoryId) }] : []));
    const target = lists.find((entry) => entry.listId === candidate.listId) ?? null;
    const targetName = target?.category?.name ?? "the guide";
    const key = placeKey(candidate.place);
    const alreadyThere = Boolean(key && candidate.listId && sectionHasPlace(sections, candidate.listId, key));

    return (
      <PlacePreviewPanel
        place={candidate.place}
        isAdded={alreadyThere}
        savedToTrip
        statusLabel="Not in the guide yet"
        addLabel={alreadyThere ? "Already in this list" : `Add to ${targetName}`}
        canAddToTrip={!alreadyThere && !addError}
        addUnavailableReason={alreadyThere ? "It's already in this list. Choose another list, or close this preview." : (addError ?? undefined)}
        onAddToTrip={() => {
          const result = addPlace(candidate.listId, candidate.place);
          if (result !== "added") setFailure({ candidate, message: ADD_PLACE_ERRORS[result] });
        }}
        onClose={() => setCandidate(null)}
        addTarget={
          lists.length > 1 ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                {target?.category ? <CategoryIcon category={target.category} size="sm" /> : null}
                <span>
                  List: <span className="font-medium text-foreground">{targetName}</span>
                </span>
                <span className="sr-only">, change list</span>
                <ChevronDown aria-hidden="true" className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="w-60">
                <DropdownMenuGroup>
                <DropdownMenuLabel>Add to list</DropdownMenuLabel>
                {lists.map((entry, index) => (
                  <DropdownMenuItem
                    key={entry.listId}
                    onClick={() => {
                      setCandidate({ ...candidate, listId: entry.listId });
                      setActiveList(entry.listId);
                    }}
                  >
                    {entry.category ? <CategoryIcon category={entry.category} size="sm" /> : null}
                    <span className="flex-1 truncate">
                      {entry.category?.name ?? "Place list"}
                      {lists.filter((other) => other.category?.id === entry.category?.id).length > 1 ? ` (${index + 1})` : ""}
                    </span>
                    {entry.listId === candidate.listId ? <Check aria-label="Chosen list" /> : null}
                  </DropdownMenuItem>
                ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null
        }
      />
    );
  }

  if (!selectedPlace) return null;
  const location = sections.flatMap((section) => section.places.map((entry) => ({ section, entry }))).find(({ entry }) => entry.key === selected?.key);
  const category = findCategory(guide, location?.section.categoryId ?? null);

  return (
    <PlacePreviewPanel
      place={{ ...selectedPlace, ...details.data, name: selectedPlace.name, address: selectedPlace.address || details.data?.address || "" }}
      isAdded
      savedToTrip
      showAddAction={false}
      isLoadingDetails={details.isLoading}
      statusLabel={location ? `${category?.name ?? "Place"} ${location.entry.number}` : "In the guide"}
      onClose={() => setSelected(null)}
    />
  );
}

"use client";

import { useCallback, useId, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Briefcase, House, Loader2, MapPin } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import type { TripAnchor } from "../constants/types";
import { PinPickerMap, isPinMapConfigured, type Coordinate } from "./pin-picker-map";
import {
  SavedPlaceApiError,
  createSavedPlace,
  savedPlacesQueryKey,
  type SavedPlaceKind,
} from "./saved-place-api";

const KIND_OPTIONS = [
  { value: "HOME", label: "Home", icon: House },
  { value: "WORK", label: "Work", icon: Briefcase },
  { value: "CUSTOM", label: "Other", icon: MapPin },
] as const satisfies ReadonlyArray<{ value: SavedPlaceKind; label: string; icon: typeof House }>;

const DEFAULT_LABEL: Record<SavedPlaceKind, string> = {
  HOME: "Home",
  WORK: "Work",
  CUSTOM: "Pinned location",
};

type AxisResult = { value: number | null; error?: string };

function parseAxis(text: string, limit: number): AxisResult {
  const trimmed = text.trim();
  // Empty or still mid-typing ("-", "."): not a value yet, but not an error either.
  if (/^-?\.?$/.test(trimmed)) return { value: null };
  const value = Number(trimmed);
  if (!Number.isFinite(value) || Math.abs(value) > limit) {
    return { value: null, error: `Enter a number between -${limit} and ${limit}.` };
  }
  return { value };
}

function formatAxis(value: number): string {
  return String(Number(value.toFixed(6)));
}

type ManualAnchorPickerProps = {
  initial: Coordinate;
  onSelect: (anchor: TripAnchor) => void;
  onBack: () => void;
};

export function ManualAnchorPicker({ initial, onSelect, onBack }: ManualAnchorPickerProps) {
  const id = useId();
  const queryClient = useQueryClient();
  const [mapError, setMapError] = useState(false);
  const [coordinatesOpen, setCoordinatesOpen] = useState(false);
  // The text fields are the single source of truth; the map writes into them.
  const [latText, setLatText] = useState("");
  const [lngText, setLngText] = useState("");
  const [saveToFavorites, setSaveToFavorites] = useState(true);
  const [kind, setKind] = useState<SavedPlaceKind>("HOME");
  const [label, setLabel] = useState(DEFAULT_LABEL.HOME);
  const [labelEdited, setLabelEdited] = useState(false);

  const lat = useMemo(() => parseAxis(latText, 90), [latText]);
  const lng = useMemo(() => parseAxis(lngText, 180), [lngText]);
  const point = useMemo<Coordinate | null>(
    () => (lat.value !== null && lng.value !== null ? { lat: lat.value, lng: lng.value } : null),
    [lat.value, lng.value],
  );

  const showMap = isPinMapConfigured() && !mapError;
  const trimmedLabel = label.trim();
  const labelMissing = saveToFavorites && !trimmedLabel;

  const save = useMutation({
    mutationFn: createSavedPlace,
    onSuccess: (place) => {
      void queryClient.invalidateQueries({ queryKey: savedPlacesQueryKey });
      onSelect({
        id: place.id,
        kind: "SAVED_PLACE",
        name: place.label,
        address: place.address ?? undefined,
        lat: place.lat,
        lng: place.lng,
      });
    },
    onError: (error) => {
      console.error("Saving a pinned place failed.", {
        component: "ManualAnchorPicker",
        operation: "createSavedPlace",
        error,
      });
    },
  });

  const handlePointChange = useCallback((next: Coordinate) => {
    setLatText(formatAxis(next.lat));
    setLngText(formatAxis(next.lng));
  }, []);

  const handleMapError = useCallback(() => {
    console.error("Pin picker map failed to load.", {
      component: "ManualAnchorPicker",
      operation: "loadMap",
    });
    setMapError(true);
  }, []);

  function chooseKind(next: SavedPlaceKind) {
    setKind(next);
    // Follow the kind until the user has typed a name of their own.
    if (!labelEdited || !trimmedLabel) {
      setLabel(DEFAULT_LABEL[next]);
      setLabelEdited(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!point || save.isPending) return;

    if (!saveToFavorites) {
      onSelect({
        id: `manual:${point.lat.toFixed(6)},${point.lng.toFixed(6)}`,
        kind: "MANUAL",
        name: (trimmedLabel || DEFAULT_LABEL.CUSTOM).slice(0, 255),
        lat: point.lat,
        lng: point.lng,
      });
      return;
    }

    if (!trimmedLabel) return;
    save.mutate({ label: trimmedLabel.slice(0, 80), name: trimmedLabel, kind, ...point });
  }

  const saveErrorMessage =
    save.error instanceof SavedPlaceApiError
      ? save.error.message
      : "Could not save this place. Check the details and try again.";

  return (
    <form onSubmit={handleSubmit} aria-label="Pin a location" className="flex min-w-0 flex-col gap-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">Pin a location on the map</p>
        <p className="text-sm text-muted-foreground">
          Click to drop a pin, then drag it to fine-tune.
        </p>
      </div>

      {showMap ? (
        <PinPickerMap
          initial={initial}
          point={point}
          onPointChange={handlePointChange}
          onError={handleMapError}
        />
      ) : (
        <p role="status" className="rounded-lg bg-muted px-3 py-2.5 text-sm text-muted-foreground">
          The map is unavailable right now. Enter the coordinates below instead.
        </p>
      )}

      <Accordion
        value={!showMap || coordinatesOpen ? ["coordinates"] : []}
        onValueChange={(value) => setCoordinatesOpen(value.length > 0)}
      >
        <AccordionItem value="coordinates">
          <AccordionTrigger
            iconSide="left"
            disabled={!showMap}
            className="py-1 font-normal text-muted-foreground hover:text-foreground hover:no-underline"
          >
            Enter coordinates
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Field data-invalid={Boolean(lat.error)}>
                <FieldLabel htmlFor={`${id}-lat`}>Latitude</FieldLabel>
                <Input
                  id={`${id}-lat`}
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder={formatAxis(initial.lat)}
                  value={latText}
                  aria-invalid={Boolean(lat.error)}
                  aria-describedby={lat.error ? `${id}-lat-error` : undefined}
                  onChange={(event) => setLatText(event.target.value)}
                />
                {lat.error && <FieldError id={`${id}-lat-error`}>{lat.error}</FieldError>}
              </Field>
              <Field data-invalid={Boolean(lng.error)}>
                <FieldLabel htmlFor={`${id}-lng`}>Longitude</FieldLabel>
                <Input
                  id={`${id}-lng`}
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder={formatAxis(initial.lng)}
                  value={lngText}
                  aria-invalid={Boolean(lng.error)}
                  aria-describedby={lng.error ? `${id}-lng-error` : undefined}
                  onChange={(event) => setLngText(event.target.value)}
                />
                {lng.error && <FieldError id={`${id}-lng-error`}>{lng.error}</FieldError>}
              </Field>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <FieldGroup className="gap-4">
        <FieldLabel className="font-normal">
          <Checkbox
            checked={saveToFavorites}
            onCheckedChange={(checked) => setSaveToFavorites(checked)}
            disabled={save.isPending}
          />
          Save to my favorite places for future trips
        </FieldLabel>

        {saveToFavorites && (
          <FieldSet className="gap-2" disabled={save.isPending}>
            <FieldLegend variant="label" className="mb-0">
              Save as
            </FieldLegend>
            <div className="flex flex-wrap gap-2">
              {KIND_OPTIONS.map(({ value, label: optionLabel, icon: Icon }) => (
                <Button
                  key={value}
                  type="button"
                  size="lg"
                  variant={kind === value ? "default" : "outline"}
                  aria-pressed={kind === value}
                  onClick={() => chooseKind(value)}
                  className="px-3"
                >
                  <Icon aria-hidden="true" />
                  {optionLabel}
                </Button>
              ))}
            </div>
          </FieldSet>
        )}

        <Field data-invalid={labelMissing}>
          <FieldLabel htmlFor={`${id}-name`}>Place name</FieldLabel>
          <Input
            id={`${id}-name`}
            maxLength={80}
            placeholder={saveToFavorites ? "e.g. Home" : DEFAULT_LABEL.CUSTOM}
            value={label}
            disabled={save.isPending}
            aria-invalid={labelMissing}
            aria-describedby={labelMissing ? `${id}-name-error` : undefined}
            onChange={(event) => {
              setLabel(event.target.value);
              setLabelEdited(true);
            }}
          />
          {labelMissing && (
            <FieldError id={`${id}-name-error`}>Give this place a name to save it.</FieldError>
          )}
        </Field>
      </FieldGroup>

      {save.isError && (
        <p role="alert" className="text-sm text-destructive">
          {saveErrorMessage}
        </p>
      )}

      {/* Pinned to the bottom of the scrolling dialog so the action is always in reach. */}
      <div className="sticky -bottom-4 z-10 -mx-4 -mb-4 flex flex-col-reverse gap-2 border-t border-border bg-popover p-4 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="ghost" size="lg" onClick={onBack} disabled={save.isPending}>
          <ArrowLeft aria-hidden="true" />
          Back to search
        </Button>
        <div className="flex flex-col items-stretch gap-1 sm:items-end">
          <Button
            type="submit"
            size="lg"
            className="px-4"
            disabled={!point || labelMissing || save.isPending}
            aria-describedby={!point ? `${id}-submit-hint` : undefined}
          >
            {save.isPending ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <MapPin aria-hidden="true" />
            )}
            {save.isPending ? "Saving…" : saveToFavorites ? "Save and use" : "Use this location"}
          </Button>
          {!point && (
            <p id={`${id}-submit-hint`} role="status" className="text-center text-xs text-muted-foreground sm:text-right">
              Drop a pin to continue
            </p>
          )}
        </div>
      </div>
    </form>
  );
}

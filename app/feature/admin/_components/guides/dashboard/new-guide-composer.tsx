"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Provider, useAtomValue, type createStore } from "jotai";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, PenLine } from "lucide-react";

import { Button } from "@/components/ui/button";

import { DestinationSearch } from "../../../../planner/_components/destination-search";
import { isSelectingDestinationAtom, selectedDestinationAtom } from "../../../../planner/_components/planner-setup.atoms";
import { countryFromSecondaryText, createGuide as newGuide } from "../guide-model";
import { createGuide, guideKeys, type GuideSummary } from "../guides-api";

type NewGuideComposerProps = {
  /** Its own store, so this search never shares state with Plan a new trip. */
  searchStore: ReturnType<typeof createStore>;
  guides: readonly GuideSummary[];
  disabled?: boolean;
};

/**
 * Where a new guide starts: pick the destination as you would for a trip, then
 * write. A destination that already has a guide opens it instead.
 */
export function NewGuideComposer({ searchStore, guides, disabled }: NewGuideComposerProps) {
  const router = useRouter();
  const inputId = useId();
  const errorId = useId();
  const queryClient = useQueryClient();
  const creation = useMutation({
    mutationFn: createGuide,
    onSuccess: (guide) => {
      void queryClient.invalidateQueries({ queryKey: guideKeys.list });
      router.push(`/admin/guides/${guide.id}`);
    },
    onError: (error) => {
      setError(error.message);
      void queryClient.invalidateQueries({ queryKey: guideKeys.list });
    },
  });
  const destination = useAtomValue(selectedDestinationAtom, { store: searchStore });
  const isSelecting = useAtomValue(isSelectingDestinationAtom, { store: searchStore });
  const [error, setError] = useState<string | null>(null);
  const existing = destination ? guides.find((guide) => guide.destinationProvider === destination.provider && guide.destinationPlaceId === destination.id) : null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSelecting || disabled || creation.isPending) return;
    if (!destination) {
      setError("Choose a destination from the suggestions first.");
      return;
    }
    if (existing) {
      router.push(`/admin/guides/${existing.id}`);
      return;
    }
    if (!destination.coordinates) {
      setError(`Navio could not locate ${destination.name}. Choose it from the suggestions again.`);
      return;
    }
    creation.mutate(newGuide({
      id: crypto.randomUUID(),
      now: new Date().toISOString(),
      destination: {
        provider: destination.provider,
        providerPlaceId: destination.id,
        name: destination.name,
        lat: destination.coordinates.latitude,
        lng: destination.coordinates.longitude,
      },
      country: countryFromSecondaryText(destination.country),
    }));
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-xs ring-1 ring-foreground/10 sm:p-5">
      <label htmlFor={inputId} className="flex items-center gap-2 text-base font-semibold">
        <PenLine aria-hidden="true" className="size-4 text-primary" />
        Write a new guide
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1" onInput={() => setError(null)}>
          <Provider store={searchStore}>
            <DestinationSearch inputId={inputId}>
              <DestinationSearch.Input aria-label="Guide destination" errorMessageId={errorId} placeholder="Which city or region is it for? e.g. Bangkok" />
              <DestinationSearch.Listbox />
            </DestinationSearch>
          </Provider>
        </div>
        <Button type="submit" size="lg" className="h-11 rounded-sm px-5" disabled={isSelecting || disabled || creation.isPending}>
          {creation.isPending ? "Creating…" : existing ? `Open the ${existing.name} guide` : "Start writing"}
          <ArrowRight aria-hidden="true" data-icon="inline-end" />
        </Button>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          {existing ? `${existing.name} already has a guide. Open it to keep writing.` : "Each destination has one guide. Typing also filters the guides below."}
        </p>
      )}
    </form>
  );
}

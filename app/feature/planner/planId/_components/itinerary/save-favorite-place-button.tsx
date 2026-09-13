"use client";

import { useId, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { TripAnchor } from "../constants/types";
import { createSavedPlace, listSavedPlaces, savedPlacesQueryKey, type SavedPlace, type SavedPlaceKind } from "./saved-place-api";

export function SaveFavoritePlaceButton({ anchor }: { anchor: TripAnchor }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(anchor.name.slice(0, 80));
  const [kind, setKind] = useState<SavedPlaceKind>("CUSTOM");
  const nameId = useId();
  const queryClient = useQueryClient();
  const favorites = useQuery({ queryKey: savedPlacesQueryKey, queryFn: ({ signal }) => listSavedPlaces(signal), staleTime: 60_000, retry: 1 });
  const save = useMutation({
    mutationFn: createSavedPlace,
    onSuccess: (place) => {
      queryClient.setQueryData<SavedPlace[]>(savedPlacesQueryKey, (previous) => [
        ...(previous ?? []).filter((item) => item.id !== place.id), place,
      ]);
      void queryClient.invalidateQueries({ queryKey: savedPlacesQueryKey });
      setOpen(false);
    },
  });
  const isSaved = anchor.kind === "SAVED_PLACE" || save.isSuccess || favorites.data?.some((place) =>
    place.id === anchor.id || (anchor.kind === "PLACE" && place.providerPlaceId === anchor.id) ||
    (Math.abs(place.lat - anchor.lat) < 0.000001 && Math.abs(place.lng - anchor.lng) < 0.000001),
  );

  return <>
    <Button type="button" variant="outline" size="sm" disabled={Boolean(isSaved)} onClick={() => setOpen(true)}>
      {isSaved ? <BookmarkCheck className="size-4" aria-hidden="true" /> : <Bookmark className="size-4" aria-hidden="true" />}
      {isSaved ? "Saved to favorites" : "Save to favorites"}
    </Button>
    <Dialog open={open} onOpenChange={(next) => { if (!save.isPending) setOpen(next); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save to favorite places</DialogTitle>
          <DialogDescription>Keep this location for future trips. Its pin is already selected.</DialogDescription>
        </DialogHeader>
        <p className="break-words text-sm text-muted-foreground">{anchor.address || anchor.name}</p>
        <form className="space-y-4" onSubmit={(event) => {
          event.preventDefault();
          if (!label.trim() || save.isPending) return;
          save.mutate({ label: label.trim(), kind, name: anchor.name.slice(0, 255),
            address: anchor.address?.slice(0, 512) || undefined,
            providerPlaceId: anchor.kind === "PLACE" ? anchor.id : undefined,
            lat: anchor.lat, lng: anchor.lng });
        }}>
          <fieldset disabled={save.isPending} className="space-y-3">
            <legend className="mb-2 text-sm font-medium">Save as</legend>
            <div className="flex flex-wrap gap-2">
              {([ ["HOME", "Home"], ["WORK", "Work"], ["CUSTOM", "Other"] ] as const).map(([value, title]) =>
                <Button key={value} type="button" variant={kind === value ? "default" : "outline"} aria-pressed={kind === value}
                  onClick={() => { setKind(value); setLabel(value === "CUSTOM" ? anchor.name.slice(0, 80) : title); }}>{title}</Button>,
              )}
            </div>
            <label htmlFor={nameId} className="block text-sm font-medium">Place name</label>
            <Input id={nameId} value={label} onChange={(event) => setLabel(event.target.value)} maxLength={80} required placeholder="e.g. Home" />
          </fieldset>
          {save.isError && <p role="alert" className="text-sm text-destructive">{save.error.message}</p>}
          <Button type="submit" className="w-full" disabled={save.isPending || !label.trim()}>
            {save.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Bookmark className="size-4" aria-hidden="true" />}
            {save.isPending ? "Saving..." : "Save to favorites"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  </>;
}

"use client";

import { useId, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { createStore, Provider, useAtomValue } from "jotai";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DestinationSearch } from "../planner/_components/destination-search";
import {
  isSelectingDestinationAtom,
  selectedDestinationAtom,
} from "../planner/_components/planner-setup.atoms";
import {
  countryFromSecondaryText,
  createGuide,
} from "../admin/_components/guides/guide-model";
import { userGuideWorkspace } from "./user-guides-api";

export function NewGuideDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <PenLine aria-hidden="true" />
        Write a guide
      </DialogTrigger>
      <DialogContent className="gap-6 p-6 sm:max-w-lg [&>[data-slot=dialog-close]]:top-4 [&>[data-slot=dialog-close]]:right-4">
        <DialogHeader className="pr-8">
          <DialogTitle>Where is your guide for?</DialogTitle>
          <DialogDescription className="text-pretty">
            Choose a city, region or country. Add your favorite places and write
            what makes them worth a visit.
          </DialogDescription>
        </DialogHeader>
        {open ? <NewGuideForm onCancel={() => setOpen(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function NewGuideForm({ onCancel }: { onCancel: () => void }) {
  const [store] = useState(createStore);
  const inputId = useId();
  const errorId = useId();
  const destination = useAtomValue(selectedDestinationAtom, { store });
  const isSelecting = useAtomValue(isSelectingDestinationAtom, { store });
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();
  const workspace = useMemo(
    () => userGuideWorkspace(session?.user?.id ?? ""),
    [session?.user?.id],
  );
  const router = useRouter();
  const queryClient = useQueryClient();
  const creation = useMutation({
    mutationFn: workspace.create,
    onSuccess: (guide) => {
      void queryClient.invalidateQueries({ queryKey: workspace.keys.list });
      router.push(`${workspace.home}/${guide.id}`);
      onCancel();
    },
    onError: (error) => {
      console.error("Creating a user guide failed.", {
        component: "NewGuideDialog",
        error,
      });
      setError(error.message);
    },
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creation.isPending || isSelecting) return;
    if (!destination?.coordinates) {
      setError("Choose a destination from the suggestions first.");
      return;
    }
    creation.mutate(
      createGuide({
        id: crypto.randomUUID(),
        now: new Date().toISOString(),
        country: countryFromSecondaryText(destination.country),
        destination: {
          provider: destination.provider,
          providerPlaceId: destination.id,
          name: destination.name,
          lat: destination.coordinates.latitude,
          lng: destination.coordinates.longitude,
        },
      }),
    );
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor={inputId} className="text-sm font-medium">
          City, region or country
        </label>
        <Provider store={store}>
          <DestinationSearch inputId={inputId}>
            <DestinationSearch.Input
              placeholder="Search for a destination"
              aria-label="Guide destination"
              errorMessageId={error ? errorId : undefined}
            />
            <DestinationSearch.Listbox />
          </DestinationSearch>
        </Provider>
        {error ? (
          <p id={errorId} role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Your guide starts as a private draft. Publish it when you are ready to
          share.
        </p>
      </div>
      <DialogFooter className="-mx-6 -mb-6 px-6 py-4">
        <Button
          type="button"
          variant="outline"
          disabled={creation.isPending}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSelecting || creation.isPending || !session?.user?.id}
        >
          {creation.isPending ? (
            <Loader2 aria-hidden="true" className="animate-spin" />
          ) : (
            <PenLine aria-hidden="true" />
          )}
          {creation.isPending ? "Creating…" : "Start writing"}
        </Button>
      </DialogFooter>
    </form>
  );
}

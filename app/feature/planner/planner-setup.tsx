"use client";

import type { FormEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAtomValue, useSetAtom } from "jotai";
import { useMutation } from "@tanstack/react-query";

import { PlannerSetupActions } from "./_components/planner-setup.actions";
import { createTrip } from "./_components/planner-api";
import {
  canSubmitPlannerAtom,
  destinationValidationErrorAtom,
  isCreatingTripAtom,
  plannerDateRangeAtom,
  selectedDestinationAtom,
} from "./_components/planner-setup.atoms";
import { PlannerSetupFieldGroup } from "./_components/planner-setup.field-group";
import { PlannerSetupHeader } from "./_components/planner-setup.header";

function PlannerSetupRoot({ children }: { children: ReactNode }) {
  const router = useRouter();
  const selectedDestination = useAtomValue(selectedDestinationAtom);
  const dateRange = useAtomValue(plannerDateRangeAtom);
  const canSubmit = useAtomValue(canSubmitPlannerAtom);
  const setValidationError = useSetAtom(destinationValidationErrorAtom);
  const setIsCreatingTrip = useSetAtom(isCreatingTripAtom);
  const createTripMutation = useMutation({
    mutationFn: createTrip,
    onMutate: () => {
      setValidationError(null);
      setIsCreatingTrip(true);
    },
    onSuccess: (trip) => {
      const searchParams = new URLSearchParams({
        destinationId: trip.destinationId,
        destinationName: trip.destinationName,
      });

      if (dateRange?.from) searchParams.set("from", dateRange.from.toISOString());
      if (dateRange?.to) searchParams.set("to", dateRange.to.toISOString());
      if (trip.destinationLat !== null) {
        searchParams.set("lat", String(trip.destinationLat));
      }
      if (trip.destinationLng !== null) {
        searchParams.set("lng", String(trip.destinationLng));
      }

      router.push(`/planner/${trip.id}?${searchParams.toString()}`);
    },
    onError: (error) => {
      console.error("Trip creation failed.", {
        component: "PlannerSetup",
        operation: "createTrip",
        error,
      });
      setValidationError(
        error instanceof Error
          ? error.message
          : "Unable to create your trip. Please try again.",
      );
    },
    onSettled: () => setIsCreatingTrip(false),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit || !selectedDestination) {
      setValidationError(
        "Choose a destination from the suggestions to continue.",
      );
      return;
    }

    const today = new Date();
    const startDate = dateRange?.from ?? today;
    const endDate = dateRange?.to ?? startDate;
    createTripMutation.mutate({
      displayName: `Trip to ${selectedDestination.name}`,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      destinationId: selectedDestination.id,
      destinationName: selectedDestination.name,
      destinationLat: selectedDestination.coordinates?.latitude,
      destinationLng: selectedDestination.coordinates?.longitude,
    });
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16 sm:px-10"
    >
      {children}
    </form>
  );
}

function formatDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const PlannerSetup = Object.assign(PlannerSetupRoot, {
  Header: PlannerSetupHeader,
  FieldGroup: PlannerSetupFieldGroup,
  Actions: PlannerSetupActions,
});

export function PlannerSetupView() {
  return (
    <div className="flex items-start justify-center">
      <PlannerSetup>
        <PlannerSetup.Header
          title="Plan a new trip"
          subtitle="Start with a destination and dates. You can refine details later."
        />
        <PlannerSetup.FieldGroup
          label="Where to?"
          placeholder="e.g. Bangkok, Chiang Mai, Thailand"
          hint="Destination"
        />
        <PlannerSetup.FieldGroup
          label="Dates (optional)"
          type="date-range"
          startPlaceholder="Start date"
          endPlaceholder="End date"
        />
        <PlannerSetup.Actions
          primaryLabel="Start planning"
          secondaryLabel="Or write a new guide"
          secondaryHref="/guides/new"
        />
        <p className="text-center text-xs text-muted-foreground">
          By continuing you agree to our terms and privacy policy.
        </p>
      </PlannerSetup>
    </div>
  );
}

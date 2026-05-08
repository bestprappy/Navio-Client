"use client";

import type { FormEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAtomValue, useSetAtom } from "jotai";

import { PlannerSetupActions } from "./_components/planner-setup.actions";
import {
  canSubmitPlannerAtom,
  destinationValidationErrorAtom,
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit || !selectedDestination) {
      setValidationError(
        "Choose a destination from the suggestions to continue.",
      );
      return;
    }

    const planId = createPlanId();
    const searchParams = new URLSearchParams({
      destinationId: selectedDestination.id,
      destinationName: selectedDestination.name,
    });

    if (dateRange?.from) {
      searchParams.set("from", dateRange.from.toISOString());
    }

    if (dateRange?.to) {
      searchParams.set("to", dateRange.to.toISOString());
    }

    router.push(`/planner/${planId}?${searchParams.toString()}`);
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

function createPlanId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `plan-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
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

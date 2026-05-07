"use client";

import type { ReactNode } from "react";

import { PlannerSetupActions } from "./planner-setup.actions";
import { PlannerSetupFieldGroup } from "./planner-setup.field-group";
import { PlannerSetupHeader } from "./planner-setup.header";

function PlannerSetupRoot({ children }: { children: ReactNode }) {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-14 sm:px-10">
      {children}
    </section>
  );
}

export const PlannerSetup = Object.assign(PlannerSetupRoot, {
  Header: PlannerSetupHeader,
  FieldGroup: PlannerSetupFieldGroup,
  Actions: PlannerSetupActions,
});

export function PlannerSetupView() {
  return (
    <div className="flex min-h-screen items-start justify-center bg-background">
      <PlannerSetup>
        <PlannerSetup.Header
          title="Plan a new trip"
          subtitle="Start with a destination and dates. You can refine details later."
        />
        <PlannerSetup.FieldGroup
          label="Where to?"
          placeholder="e.g. Paris, Hawaii, Japan"
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

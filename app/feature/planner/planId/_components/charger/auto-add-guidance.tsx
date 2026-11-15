"use client";

import { AlertTriangle, CarFront, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { focusVehicleEnergySettings } from "../garage/focus-vehicle-settings";

/** Why Auto Add cannot run (or has nothing to do) for the selected day. */
export type AutoAddBlocker =
  | "no-vehicle"
  | "unsaved-trip"
  | "energy-unconfirmed"
  | "sign-in"
  | "satisfied"
  | "infeasible";

type AutoAddGuidanceProps = {
  blocker: AutoAddBlocker | null;
  /** Runs before the planner scrolls to the garage, for example to close a dialog. */
  onOpenVehicleSettings?: () => void;
};

type GuidanceCopy = {
  tone: "warning" | "info";
  title: string;
  body: string;
  action?: string;
};

const COPY: Record<AutoAddBlocker, GuidanceCopy> = {
  "no-vehicle": {
    tone: "warning",
    title: "Choose your EV first",
    body: "Auto Add plans charging for the car in My garage. Add or select a vehicle there.",
    action: "Go to My garage",
  },
  "unsaved-trip": {
    tone: "info",
    title: "Save this trip first",
    body: "Sign in and open a saved trip to plan charging stops.",
  },
  "energy-unconfirmed": {
    tone: "warning",
    title: "Choose how Navio estimates energy",
    body: "Auto Add needs an energy estimate and a battery size to predict the battery. In vehicle settings, pick Vehicle Default, NAVIO Estimate or Custom, then save.",
    action: "Open vehicle settings",
  },
  "sign-in": {
    tone: "info",
    title: "Sign in to use Auto Add",
    body: "Charging stops are checked and saved on your account.",
  },
  satisfied: {
    tone: "info",
    title: "No Auto Add slot on this day",
    body: "This day doesn't need another charging stop: every stop stays above your Battery Threshold and the day ends above your Minimum Arrival Battery. Raise either setting to charge sooner.",
  },
  infeasible: {
    tone: "warning",
    title: "No workable charging plan found",
    body: "No compatible charger within 20 km keeps this day above your limits. Try a lower Battery Threshold or Minimum Arrival Battery, or add a charger from the list.",
  },
};

/** Explains in plain words why the Auto Add button is unavailable, with the fix when there is one. */
export function AutoAddGuidance({ blocker, onOpenVehicleSettings }: AutoAddGuidanceProps) {
  if (!blocker) return null;
  const copy = COPY[blocker];
  const Icon = copy.tone === "warning" ? AlertTriangle : Info;
  const openSettings = () => {
    onOpenVehicleSettings?.();
    focusVehicleEnergySettings();
  };

  return (
    <div
      role="status"
      className={
        copy.tone === "warning"
          ? "mt-3 flex gap-2 rounded-sm border border-warning/40 bg-warning/10 p-3"
          : "mt-3 flex gap-2 rounded-sm border border-border bg-background/60 p-3"
      }
    >
      <Icon
        className={copy.tone === "warning" ? "mt-0.5 size-4 shrink-0 text-warning" : "mt-0.5 size-4 shrink-0 text-muted-foreground"}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{copy.title}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{copy.body}</p>
        {copy.action ? (
          <Button type="button" variant="outline" size="sm" className="mt-2 gap-1.5" onClick={openSettings}>
            <CarFront className="size-3.5" aria-hidden="true" />
            {copy.action}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

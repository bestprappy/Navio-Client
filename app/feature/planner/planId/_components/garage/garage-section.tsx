"use client";

import { useMemo } from "react";
import { AlertTriangle, Car, Plus } from "lucide-react";
import { useAtom, useAtomValue } from "jotai";

import { Button } from "@/components/ui/button";

import { itineraryBlocksAtom } from "../overview/trip-builder.atoms";
import { useTripRoutes } from "../routes/trip-route-query";
import { getVehicleCar } from "../constants/vehicle.data";
import {
  activeEvCarAtom,
  activeVehicleAtom,
  activeVehicleIdAtom,
  garageModalOpenAtom,
  userVehiclesAtom,
} from "./garage.atoms";
import { useTripCharging } from "./use-trip-charging";
import { VehicleCard } from "./vehicle-card";
import { AddVehicleDialog } from "./add-vehicle-dialog";
import { VehicleUsageOverview } from "./vehicle-usage-overview";
import { VehicleSettingsForm } from "./vehicle-settings-form";
import { useGarage } from "./garage-provider";

export function GarageSection() {
  const vehicles = useAtomValue(userVehiclesAtom);
  const activeVehicleId = useAtomValue(activeVehicleIdAtom);
  const activeVehicle = useAtomValue(activeVehicleAtom);
  const activeEvCar = useAtomValue(activeEvCarAtom);
  const [isModalOpen, setModalOpen] = useAtom(garageModalOpenAtom);
  const { query, mutation, vehicles: savedVehicles, authenticated, loadingSession } = useGarage();
  const savedActiveVehicle = savedVehicles.find((vehicle) => vehicle.id === activeVehicleId);

  const blocks = useAtomValue(itineraryBlocksAtom);
  const { data: routeData } = useTripRoutes();

  const charging = useTripCharging();
  const tripSummary = routeData && blocks.length ? charging?.summary ?? null : null;

  const totalDrivingMinutes = useMemo(() => {
    if (!routeData) return 0;
    return Math.round(
      routeData.segments.reduce((sum, s) => sum + (s.durationSeconds ?? 0), 0) / 60,
    );
  }, [routeData]);

  return (
    <section className="px-4 py-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">My garage</h2>
          <p className="mt-3 text-sm text-muted-foreground ">
            Your saved EVs, ready for your next trip. Select one for route estimates.
          </p>
        </div>
        <Button
          type="button"
          size="lg"
          className="mr-2 gap-2 rounded-full px-5"
          disabled={!authenticated || query.isPending || query.isError || mutation.isPending || vehicles.length >= 25}
          onClick={() => { mutation.reset(); setModalOpen(true); }}
        >
          <Plus className="size-4" aria-hidden="true" />
          Add vehicle
        </Button>
      </div>

      {(loadingSession || (authenticated && query.isPending)) && <p role="status" className="p-4 text-sm text-muted-foreground">Loading your saved vehicles…</p>}
      {!loadingSession && !authenticated && <p role="status" className="p-4 text-sm text-muted-foreground">Sign in to load and save your garage.</p>}
      {authenticated && query.isError && <div role="alert" className="mb-4 rounded-md bg-destructive/10 p-4 text-sm text-destructive"><p>{query.error.message}</p><Button variant="outline" className="mt-2" onClick={() => void query.refetch()}>Reload garage</Button></div>}
      {mutation.isError && !isModalOpen && <p role="alert" className="mb-4 rounded-md bg-destructive/10 p-4 text-sm text-destructive">{mutation.error.message}</p>}
      {mutation.isPending && <p role="status" className="mb-3 text-sm text-muted-foreground">Saving your garage…</p>}
      {authenticated && query.isSuccess && vehicles.length === 0 ? (
        <div className="mx-1 flex items-center gap-3 rounded-sm border border-primary/30 bg-primary/5 p-4">
          <Car className="size-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-primary">No vehicle added</p>
            <p className="text-xs text-primary/70">
              Add your EV to track battery usage and charge time per day.
            </p>
          </div>
        </div>
      ) : (
        <div className="mx-1 grid grid-cols-1 gap-2 2xl:grid-cols-2">
          {vehicles.map((vehicle) => {
            const car = getVehicleCar(vehicle);
            if (!car) return null;
            return (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                car={car}
                isActive={vehicle.id === activeVehicleId}
                disabled={mutation.isPending || !authenticated || query.isError}
                onSelect={() => mutation.mutate({ kind: "update", id: vehicle.id, patch: { isDefault: true } })}
                onRemove={() => mutation.mutate({ kind: "delete", id: vehicle.id })}
              />
            );
          })}
        </div>
      )}

      {savedActiveVehicle && <VehicleSettingsForm key={`${savedActiveVehicle.id}:${savedActiveVehicle.updatedAt}`} vehicle={savedActiveVehicle} />}
      {activeVehicle && !activeEvCar && <p className="mt-3 text-sm text-muted-foreground">Save your average consumption to enable route estimates.</p>}
      {activeEvCar?.chargingLimitsKnown === false && <p className="mt-3 text-sm text-muted-foreground">Some charging limits are unconfirmed. Charging estimates are available only for confirmed limits.</p>}
      {vehicles.length >= 25 && <p className="mt-3 text-sm text-muted-foreground">Your garage is full (25 vehicles). Remove a vehicle to add another.</p>}

      {activeVehicle && activeEvCar && (
        <div className="mx-1 mt-6 mb-3 flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
            Usage Overview
          </span>
          <div className="flex-1 border-t border-border/40" />
        </div>
      )}

      {activeVehicle && activeEvCar && (
        <div className="mx-1">
          <VehicleUsageOverview
            car={activeEvCar}
            vehicle={activeVehicle}
            tripSummary={tripSummary}
            totalDrivingMinutes={totalDrivingMinutes}
            plannedDays={blocks.length}
          />
        </div>
      )}

      {vehicles.length > 0 && !tripSummary && (
        <div className="mx-1 mt-3 flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            Add at least two places to an itinerary day to calculate route usage.
          </p>
        </div>
      )}

      {isModalOpen && <AddVehicleDialog onClose={() => setModalOpen(false)} />}
    </section>
  );
}

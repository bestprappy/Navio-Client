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
    <section aria-label="Trip vehicles" className="@container/garage min-w-0 px-4 py-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{authenticated ? "My garage" : "Trip vehicle"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {authenticated ? "Pick the EV you're driving and the planner estimates battery and charging for every day." : "Add your EV specifications to estimate battery usage and charging time for this trip."}
          </p>
        </div>
        <Button
          type="button"
          size="lg"
          className="gap-2"
          disabled={loadingSession || (authenticated && (query.isPending || query.isError)) || mutation.isPending || vehicles.length >= 25}
          onClick={() => { mutation.reset(); setModalOpen(true); }}
        >
          <Plus className="size-4" aria-hidden="true" />
          Add vehicle
        </Button>
      </div>

      {(loadingSession || (authenticated && query.isPending)) && <p role="status" className="p-4 text-sm text-muted-foreground">Loading your saved vehicles…</p>}
      {!loadingSession && !authenticated && <p role="status" className="p-4 text-sm text-muted-foreground">Used only in this guest plan. Sign in to save vehicles to your garage.</p>}
      {authenticated && query.isError && <div role="alert" className="mb-4 rounded-md bg-destructive/10 p-4 text-sm text-destructive"><p>{query.error.message}</p><Button variant="outline" className="mt-2" onClick={() => void query.refetch()}>Reload garage</Button></div>}
      {mutation.isError && !isModalOpen && <p role="alert" className="mb-4 rounded-md bg-destructive/10 p-4 text-sm text-destructive">{mutation.error.message}</p>}
      {mutation.isPending && <p role="status" className="mb-3 text-sm text-muted-foreground">{authenticated ? "Saving your garage…" : "Updating trip vehicle…"}</p>}
      {(!authenticated || query.isSuccess) && vehicles.length === 0 ? (
        <div className="mx-1 flex items-center gap-3 rounded-md border border-dashed border-input p-4">
          <Car className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-foreground">No vehicle added</p>
            <p className="text-sm text-muted-foreground">
              Add your EV to track battery usage and charge time per day.
            </p>
          </div>
        </div>
      ) : (
        <div className={`mx-1 grid min-w-0 grid-cols-1 gap-2 ${vehicles.length > 1 ? "@min-[28rem]/garage:grid-cols-2" : ""}`}>
          {vehicles.map((vehicle) => {
            const car = getVehicleCar(vehicle);
            if (!car) return null;
            return (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                car={car}
                isActive={vehicle.id === activeVehicleId}
                disabled={mutation.isPending || loadingSession || (authenticated && query.isError)}
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
        <div className="mx-1 mt-6">
          <VehicleUsageOverview
            car={activeEvCar}
            vehicle={activeVehicle}
            tripSummary={tripSummary}
            totalDrivingMinutes={totalDrivingMinutes}
            plannedDays={blocks.length}
          />
        </div>
      )}

      {/* The usage overview shows its own empty state when it is visible. */}
      {vehicles.length > 0 && !tripSummary && !(activeVehicle && activeEvCar) && (
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

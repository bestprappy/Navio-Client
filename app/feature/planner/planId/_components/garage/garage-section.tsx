"use client";

import { useMemo } from "react";
import { AlertTriangle, Car, Plus } from "lucide-react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

import { Button } from "@/components/ui/button";

import { itineraryBlocksAtom } from "../overview/trip-builder.atoms";
import { useTripRoutes } from "../routes/trip-route-query";
import { getVehicleCar } from "../constants/vehicle.data";
import {
  isEvChargerPlaceItem,
  isPlaceItem,
  type PlaceItemEvChargerDetails,
} from "../constants/types";
import {
  activeEvCarAtom,
  activeVehicleAtom,
  activeVehicleIdAtom,
  garageModalOpenAtom,
  removeVehicleAtom,
  setActiveVehicleAtom,
  setStartingBatteryPctAtom,
  startingBatteryPctAtom,
  userVehiclesAtom,
} from "./garage.atoms";
import {
  calcDayChargeStats,
  calcDayRouteStats,
  calcTripEvSummary,
  type DayBlockSummary,
} from "./ev-calculator";
import { VehicleCard } from "./vehicle-card";
import { AddVehicleDialog } from "./add-vehicle-dialog";
import { VehicleUsageOverview } from "./vehicle-usage-overview";
import { BatterySlider, getBatteryColor } from "./battery-slider";

export function GarageSection() {
  const vehicles = useAtomValue(userVehiclesAtom);
  const activeVehicleId = useAtomValue(activeVehicleIdAtom);
  const activeVehicle = useAtomValue(activeVehicleAtom);
  const activeEvCar = useAtomValue(activeEvCarAtom);
  const startingBattery = useAtomValue(startingBatteryPctAtom);
  const [isModalOpen, setModalOpen] = useAtom(garageModalOpenAtom);
  const setActiveVehicle = useSetAtom(setActiveVehicleAtom);
  const removeVehicle = useSetAtom(removeVehicleAtom);
  const setStartingBatteryPct = useSetAtom(setStartingBatteryPctAtom);

  const blocks = useAtomValue(itineraryBlocksAtom);
  const { data: routeData } = useTripRoutes();

  const tripSummary = useMemo(() => {
    if (!activeEvCar || !routeData || blocks.length === 0) return null;

    const blockSummaries: DayBlockSummary[] = blocks.map((block) => {
      const segments = routeData.segments.filter((s) => s.blockId === block.id);
      const chargerItems = block.items
        .filter(isPlaceItem)
        .filter(isEvChargerPlaceItem)
        .map((item) => item.evCharger)
        .filter((c): c is PlaceItemEvChargerDetails => c !== undefined);

      const routeStats = calcDayRouteStats(segments, activeEvCar);
      const chargeStats = calcDayChargeStats(chargerItems, activeEvCar);

      return {
        distanceKm: routeStats.totalDistanceKm,
        energyKwh: routeStats.energyKwh,
        chargeEnergyKwh: chargeStats.chargeEnergyKwh,
        chargeMinutes: chargeStats.chargeMinutes,
      };
    });

    return calcTripEvSummary(blockSummaries, activeEvCar, startingBattery);
  }, [activeEvCar, routeData, blocks, startingBattery]);

  const totalDrivingMinutes = useMemo(() => {
    if (!routeData) return 0;
    return Math.round(
      routeData.segments.reduce((sum, s) => sum + (s.durationSeconds ?? 0), 0) / 60,
    );
  }, [routeData]);

  return (
    <section className="px-4 py-4 mx-6">
      <div className="mb-4 flex items-center justify-between pl-1">
        <div>
          <h2 className="text-2xl font-bold text-foreground">My Garage</h2>
          <p className="mt-3 text-sm text-muted-foreground ">
            Add a prebuilt EV or enter your own specs for route estimates.
          </p>
        </div>
        <Button
          type="button"
          size="lg"
          className="mr-2 gap-2 rounded-full px-5"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="size-4" aria-hidden="true" />
          Add Vehicle
        </Button>
      </div>

      {vehicles.length === 0 ? (
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
                onSelect={() => setActiveVehicle(vehicle.id)}
                onRemove={() => removeVehicle(vehicle.id)}
              />
            );
          })}
        </div>
      )}

      {vehicles.length > 0 && (
        <div className="mx-1 mt-4 rounded-md border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-4">
            <label
              htmlFor="starting-battery"
              className="text-sm font-medium text-foreground"
            >
              Starting battery
            </label>
            <span
              className="text-sm font-semibold tabular-nums"
              style={{ color: getBatteryColor(startingBattery) }}
            >
              {startingBattery}%
            </span>
          </div>
          <div className="mt-3">
            <BatterySlider
              id="starting-battery"
              value={startingBattery}
              onChange={setStartingBatteryPct}
            />
          </div>
        </div>
      )}

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

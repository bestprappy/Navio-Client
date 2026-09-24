"use client";
import { tripEnergyStateAtom, addTripVehicle, removeTripVehicle, tripGarageIds } from "./trip-energy-state";

import { createContext, useContext, useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useAtom, useStore } from "jotai";
import { applyGuestVehicleCommand, guestVehiclesAtom } from "./guest-vehicles";
import type { VehicleCommand } from "./vehicle-api";

import { garageActiveIdSnapshotAtom, garageModalOpenAtom, garageVehiclesSnapshotAtom } from "./garage.atoms";
import { executeVehicleCommand, listVehicles, VehicleApiError, type SavedVehicle } from "./vehicle-api";
import { savedVehicleForPlanner } from "./vehicle-mappers";

type TripVehicleCommand = VehicleCommand | { kind: "reuse"; id: string };

function useGarageState() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const authenticated = status === "authenticated" && Boolean(userId) && !session?.error;
  const queryClient = useQueryClient();
  const store = useStore();
  const tripGeneration = useRef(0);
  const [guestVehicles, setGuestVehicles] = useAtom(guestVehiclesAtom);
  const [tripEnergy] = useAtom(tripEnergyStateAtom);
  const queryKey = ["garage", userId] as const;
  const query = useQuery({
    queryKey, queryFn: ({ signal }) => listVehicles(signal), enabled: authenticated,
    staleTime: 30_000,
    retry: (count, error) => count < 1 && (!(error instanceof VehicleApiError) || error.status === 0 || error.status >= 500),
  });
  const mutation = useMutation({
    mutationKey: ["garage-write", userId],
    mutationFn: async (command: TripVehicleCommand) => {
      if (status === "loading") throw new Error("Wait for your session to finish loading.");
      const library = authenticated ? queryClient.getQueryData<SavedVehicle[]>(queryKey) ?? [] : store.get(guestVehiclesAtom);
      const ids = tripGarageIds(store.get(tripEnergyStateAtom));
      const targetId = command.kind === "catalog" ? library.find(vehicle => vehicle.catalog?.id === command.catalogId)?.id
        : command.kind === "custom" ? undefined : command.id;
      if ((command.kind === "catalog" || command.kind === "custom" || command.kind === "reuse") && ids.length >= 25 && (!targetId || !ids.includes(targetId))) {
        throw new Error("Remove a vehicle from this trip before adding another.");
      }
      if (command.kind === "delete") return null; // Detach from this trip; never delete a reusable vehicle.
      if (command.kind === "reuse" || (command.kind === "update" && command.patch.isDefault === true)) {
        const selected = library.find(vehicle => vehicle.id === command.id);
        if (!selected) throw new Error("This vehicle is no longer available in your vehicle list.");
        return selected;
      }
      if (authenticated) {
        // Reusing a catalogue entry must not create another account record for every trip.
        const existing = command.kind === "catalog" ? library.find(vehicle => vehicle.catalog?.id === command.catalogId) : undefined;
        return existing && command.kind === "catalog"
          ? executeVehicleCommand({ kind: "update", id: existing.id, patch: {
            energySelection: command.energySelection, consumptionKwhPer100km: command.consumptionKwhPer100km,
            consumptionProvenance: command.consumptionProvenance,
          } })
          : executeVehicleCommand(command);
      }
      const next = applyGuestVehicleCommand(store.get(guestVehiclesAtom), command);
      setGuestVehicles(next);
      return command.kind === "update" ? next.find(vehicle => vehicle.id === command.id) ?? null : next[next.length - 1];
    },
    scope: { id: `garage-${userId}` },
    onMutate: async () => {
      const generation = tripGeneration.current;
      await queryClient.cancelQueries({ queryKey });
      return { generation };
    },
    onSuccess: async (saved, command, context) => {
      // A response from a trip that was left must not attach a vehicle to the next trip.
      if (context?.generation !== tripGeneration.current) return;
      if (command.kind === "delete") {
        store.set(tripEnergyStateAtom, removeTripVehicle(store.get(tripEnergyStateAtom), command.id));
        return;
      }
      const explicitlySelected = command.kind === "reuse" || command.kind === "catalog" || command.kind === "custom" ||
        (command.kind === "update" && (command.patch.isDefault === true || command.patch.energySelection !== undefined));
      if (saved && explicitlySelected) {
        const current = store.get(tripEnergyStateAtom);
        store.set(tripEnergyStateAtom, addTripVehicle(current, saved));
      }
      if (!authenticated || command.kind === "reuse" || (command.kind === "update" && command.patch.isDefault === true)) return;
      // Apply the confirmed server response even if the subsequent refresh fails.
      queryClient.setQueryData<SavedVehicle[]>(queryKey, (current = []) => {
        if (!saved) return current;
        const remaining = current.filter((vehicle) => vehicle.id !== saved.id)
          .map((vehicle) => saved.isDefault ? { ...vehicle, isDefault: false } : vehicle);
        return [...remaining, saved].sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.createdAt.localeCompare(b.createdAt));
      });
      await queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => { console.error("Could not save garage changes.", { component: "GarageProvider", error }); },
  });
  const libraryVehicles = useMemo(() => authenticated ? query.data ?? [] : guestVehicles, [authenticated, query.data, guestVehicles]);
  const vehicles = useMemo(() => {
    const ids = new Set(tripGarageIds(tripEnergy));
    return libraryVehicles.filter(vehicle => ids.has(vehicle.id));
  }, [libraryVehicles, tripEnergy]);
  useLayoutEffect(() => {
    store.set(garageVehiclesSnapshotAtom, vehicles.map(savedVehicleForPlanner));
    store.set(garageActiveIdSnapshotAtom, null);
  }, [store, vehicles]);
  useLayoutEffect(() => () => {
    tripGeneration.current += 1;
    store.set(garageVehiclesSnapshotAtom, []);
    store.set(garageActiveIdSnapshotAtom, null);
    store.set(garageModalOpenAtom, false);
    store.set(tripEnergyStateAtom, undefined);
  }, [store, userId]);
  return { query, mutation, vehicles, libraryVehicles, authenticated, loadingSession: status === "loading" };
}

const GarageContext = createContext<ReturnType<typeof useGarageState> | null>(null);

export function GarageProvider({ children }: { children: ReactNode }) {
  const value = useGarageState();
  return <GarageContext.Provider value={value}>{children}</GarageContext.Provider>;
}

export function useGarage() {
  const value = useContext(GarageContext);
  if (!value) throw new Error("useGarage must be used inside GarageProvider.");
  return value;
}

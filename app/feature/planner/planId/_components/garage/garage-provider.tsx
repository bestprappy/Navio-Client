"use client";
import { tripEnergyStateAtom, addTripVehicle, removeTripVehicle, tripGarageIds } from "./trip-energy-state";

import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useAtom, useStore } from "jotai";
import { tripVehicles,patchTripVehicle,updateImportedTripVehicle } from "./trip-vehicle-library";
import {legacyEnergyProfile} from "./vehicle-api";
import { type VehicleCommand } from "./vehicle-api";

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
      if (!authenticated) throw new Error("Sign in to update your garage.");
      const library = queryClient.getQueryData<SavedVehicle[]>(queryKey) ?? [];
      const state=store.get(tripEnergyStateAtom);
      const imported=(command.kind==="update"||command.kind==="reuse")?state?.vehicles?.find(e=>e.scope==="trip"&&e.vehicle.id===command.id):undefined;
      if(imported)return command.kind==="update"?patchTripVehicle(imported.vehicle,command.patch):imported.vehicle;
      const ids = tripGarageIds(state);
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
      // Reusing a catalogue entry must not create another account record for every trip.
      const existing = command.kind === "catalog" ? library.find(vehicle => vehicle.catalog?.id === command.catalogId) : undefined;
      return existing && command.kind === "catalog"
        ? executeVehicleCommand({ kind: "update", id: existing.id, patch: {
          energySelection: command.energySelection, consumptionKwhPer100km: command.consumptionKwhPer100km,
          consumptionProvenance: command.consumptionProvenance,
        } })
        : executeVehicleCommand(command);
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
      if(saved&&store.get(tripEnergyStateAtom)?.vehicles?.some(e=>e.scope==="trip"&&e.vehicle.id===saved.id)){
        store.set(tripEnergyStateAtom,updateImportedTripVehicle(store.get(tripEnergyStateAtom),saved,explicitlySelected));return;
      }
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
  const libraryVehicles = useMemo(() => authenticated ? query.data ?? [] : [], [authenticated, query.data]);
  const vehicles=useMemo(()=>tripVehicles(tripEnergy,libraryVehicles),[libraryVehicles,tripEnergy]);
  useEffect(()=>{
    if(tripEnergy===undefined||!query.data)return;
    const descriptors=vehicles.map(vehicle=>({scope:tripEnergy?.vehicles?.find(e=>e.vehicle.id===vehicle.id)?.scope??"account" as const,vehicle:{...vehicle,energyProfile:vehicle.energyProfile??legacyEnergyProfile(vehicle)}}));
    if(JSON.stringify(descriptors)!==JSON.stringify(tripEnergy?.vehicles??[]))store.set(tripEnergyStateAtom,current=>({...current,initialSocPct:current?.initialSocPct??null,vehicleSnapshot:current?.vehicleSnapshot??null,vehicles:descriptors}));
  },[query.data,store,tripEnergy,vehicles]);
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

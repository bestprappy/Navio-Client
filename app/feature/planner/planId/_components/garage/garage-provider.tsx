"use client";

import { createContext, useContext, useLayoutEffect, useMemo, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useAtom, useStore } from "jotai";
import { applyGuestVehicleCommand, guestVehiclesAtom } from "./guest-vehicles";
import type { VehicleCommand } from "./vehicle-api";

import { garageActiveIdSnapshotAtom, garageModalOpenAtom, garageVehiclesSnapshotAtom } from "./garage.atoms";
import { executeVehicleCommand, getPublishedVehicle, listVehicles, VehicleApiError, type SavedVehicle } from "./vehicle-api";
import { savedVehicleForPlanner } from "./vehicle-mappers";

function useGarageState() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const authenticated = status === "authenticated" && Boolean(userId) && !session?.error;
  const queryClient = useQueryClient();
  const store = useStore();
  const [guestVehicles, setGuestVehicles] = useAtom(guestVehiclesAtom);
  const queryKey = ["garage", userId] as const;
  const query = useQuery({
    queryKey, queryFn: ({ signal }) => listVehicles(signal), enabled: authenticated,
    staleTime: 30_000,
    retry: (count, error) => count < 1 && (!(error instanceof VehicleApiError) || error.status === 0 || error.status >= 500),
  });
  const mutation = useMutation({
    mutationKey: ["garage-write", userId],
    mutationFn: async (command: VehicleCommand) => {
      if (status === "loading") throw new Error("Wait for your session to finish loading.");
      if (authenticated) return executeVehicleCommand(command);
      const published = command.kind === "catalog" ? await getPublishedVehicle(command.catalogId) : undefined;
      const next = applyGuestVehicleCommand(store.get(guestVehiclesAtom), command, published);
      setGuestVehicles(next);
      return command.kind === "delete" ? null : next[next.length - 1];
    },
    scope: { id: `garage-${userId}` },
    onMutate: async () => { await queryClient.cancelQueries({ queryKey }); },
    onSuccess: async (saved, command) => {
      if (!authenticated) return;
      // Apply the confirmed server response even if the subsequent refresh fails.
      queryClient.setQueryData<SavedVehicle[]>(queryKey, (current = []) => {
        if (command.kind === "delete") return current.filter((vehicle) => vehicle.id !== command.id);
        if (!saved) return current;
        const remaining = current.filter((vehicle) => vehicle.id !== saved.id)
          .map((vehicle) => saved.isDefault ? { ...vehicle, isDefault: false } : vehicle);
        return [...remaining, saved].sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.createdAt.localeCompare(b.createdAt));
      });
      await queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => { console.error("Could not save garage changes.", { component: "GarageProvider", error }); },
  });
  const vehicles = useMemo(() => authenticated ? query.data ?? [] : guestVehicles, [authenticated, query.data, guestVehicles]);
  useLayoutEffect(() => {
    store.set(garageVehiclesSnapshotAtom, vehicles.map(savedVehicleForPlanner));
    store.set(garageActiveIdSnapshotAtom, vehicles.find((vehicle) => vehicle.isDefault)?.id ?? null);
  }, [store, vehicles]);
  useLayoutEffect(() => () => {
    store.set(garageVehiclesSnapshotAtom, []);
    store.set(garageActiveIdSnapshotAtom, null);
    store.set(garageModalOpenAtom, false);
  }, [store, userId]);
  return { query, mutation, vehicles, authenticated, loadingSession: status === "loading" };
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

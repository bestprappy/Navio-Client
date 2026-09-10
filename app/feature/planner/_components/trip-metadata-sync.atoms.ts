import { atom } from "jotai";

// Trip metadata and the planner share the backend's optimistic-lock version.
// A null version marks a successful metadata save whose follow-up read failed.
export const tripMetadataPlannerVersionAtom = atom<{
  tripId: string;
  version: number | null;
} | null>(null);

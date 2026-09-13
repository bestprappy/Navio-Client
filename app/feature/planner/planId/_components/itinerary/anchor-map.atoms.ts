import { atom } from "jotai";
import type { TripAnchor } from "../constants/types";

export const focusedAnchorAtom = atom<TripAnchor | null>(null);

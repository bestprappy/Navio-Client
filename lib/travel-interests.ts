import {
  Bike,
  Building2,
  Camera,
  Car,
  Coins,
  Gem,
  HeartPulse,
  Landmark,
  Moon,
  Mountain,
  ShoppingBag,
  Trees,
  Umbrella,
  Users,
  UtensilsCrossed,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * The fixed vocabulary of optional public travel preferences. Must match
 * `TravelProfile.INTERESTS` in the user management service; unknown values are
 * rejected there. `trail` picks one of the six community identity hues so each
 * stamp keeps a stable colour.
 */
export type TravelInterest = { id: string; label: string; icon: LucideIcon; trail: 1 | 2 | 3 | 4 | 5 | 6 };

export const TRAVEL_INTERESTS: readonly TravelInterest[] = [
  { id: "nature", label: "Nature", icon: Trees, trail: 3 },
  { id: "food", label: "Food", icon: UtensilsCrossed, trail: 5 },
  { id: "road_trips", label: "Road trips", icon: Car, trail: 1 },
  { id: "ev_travel", label: "EV travel", icon: Zap, trail: 2 },
  { id: "culture", label: "Culture", icon: Landmark, trail: 6 },
  { id: "history", label: "History", icon: Building2, trail: 4 },
  { id: "beaches", label: "Beaches", icon: Umbrella, trail: 2 },
  { id: "mountains", label: "Mountains", icon: Mountain, trail: 3 },
  { id: "cities", label: "Cities", icon: Building2, trail: 1 },
  { id: "nightlife", label: "Nightlife", icon: Moon, trail: 6 },
  { id: "photography", label: "Photography", icon: Camera, trail: 4 },
  { id: "adventure", label: "Adventure", icon: Bike, trail: 5 },
  { id: "wellness", label: "Wellness", icon: HeartPulse, trail: 3 },
  { id: "shopping", label: "Shopping", icon: ShoppingBag, trail: 6 },
  { id: "family", label: "Family trips", icon: Users, trail: 1 },
  { id: "budget", label: "On a budget", icon: Coins, trail: 4 },
  { id: "luxury", label: "Luxury", icon: Gem, trail: 5 },
];

const BY_ID = new Map(TRAVEL_INTERESTS.map((interest) => [interest.id, interest]));

/** Known interests in the stored order; anything unrecognised is skipped. */
export function resolveInterests(ids: readonly string[]): TravelInterest[] {
  return ids.flatMap((id) => {
    const interest = BY_ID.get(id);
    return interest ? [interest] : [];
  });
}

export const TRAVEL_PACES = [
  { id: "relaxed", label: "Relaxed", description: "A few things a day, lots of time to wander." },
  { id: "balanced", label: "Balanced", description: "A full day with room to rest." },
  { id: "packed", label: "Packed", description: "See as much as possible." },
] as const;

export function paceLabel(id: string | null): string | null {
  return TRAVEL_PACES.find((pace) => pace.id === id)?.label ?? null;
}

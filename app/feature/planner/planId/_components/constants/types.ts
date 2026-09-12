export type ExploreItem = {
  id: string;
  title: string;
  subtitle: string;
  source: string;
  imageUrl: string;
  gradient: string;
};

export type MockPlace = {
  id: string;
  name: string;
  description?: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  reviewCount?: number;
  category?: string;
  priceLevel?: string;
  imageUrl?: string;
  openingHours?: string;
  phone?: string;
  website?: string;
};

export type EvConnectorType =
  | "CCS1"
  | "CCS2"
  | "CHADEMO"
  | "TYPE2"
  | "J1772"
  | "NACS"
  | "GB_T"
  | "OTHER";

export type EvChargerSource =
  | "GOOGLE_PLACES"
  | "OPENCHARGEMAP"
  | "ADMIN_IMPORT"
  | "USER_SUBMITTED"
  | "PARTNER_API"
  | "TRIP_SNAPSHOT";

export type EvChargerVerificationStatus =
  | "UNVERIFIED"
  | "PENDING_VERIFICATION"
  | "GOOGLE_CACHED"
  | "USER_VERIFIED"
  | "ADMIN_VERIFIED"
  | "REJECTED"
  | "STALE";

export type EvChargerStatus =
  | "active"
  | "temporarily_closed"
  | "permanently_closed"
  | "unknown";

export type EvCharger = {
  id: string;
  name: string;
  operatorName: string | null;
  location: {
    lat: number;
    lng: number;
    address: string | null;
    placeId: string | null;
  };
  address: string | null;
  province: string | null;
  connectorTypes: EvConnectorType[];
  maxKw: number;
  totalConnectors: number;
  availableConnectors: number | null;
  priceText: string | null;
  openingHours: Record<string, unknown>;
  source: EvChargerSource;
  verificationStatus: EvChargerVerificationStatus;
  status: EvChargerStatus;
  ratingAvg: number;
  ratingCount: number;
  confidenceScore: number;
  stale: boolean;
  imageUrl?: string | null;
};

export type EvChargerList = {
  items: EvCharger[];
  meta: {
    source: "local_cache" | "provider_refresh" | "stale_cache";
    tileKey: string;
    stale: boolean;
    refreshed: boolean;
  };
};

export type PlaceItemEvChargerDetails = {
  connectorTypes: EvConnectorType[];
  maxKw: number;
  totalConnectors: number;
  availableConnectors: number | null;
  priceText: string | null;
  openingHoursSummary: string | null;
  estimatedChargeMinutes: number;
  targetBatteryPct?: number | null;
  operatorName: string | null;
  selectionSource?: "AUTO" | "MANUAL";
  locked?: boolean;
};

export type GetEvChargersNearParams = {
  lat: number;
  lng: number;
  radiusKm?: number;
};

export type PlaceSuggestion = {
  id: string;
  label: string;
  searchKey: string;
};

export type PlaceProvider = "GOOGLE" | "MAPBOX";

export type PlaceAutocompleteSuggestion = {
  provider: PlaceProvider;
  providerPlaceId: string;
  mainText: string;
  secondaryText: string;
  types: string[];
  sessionToken?: string;
  place?: PlaceSearchResult;
};

export type PlaceSearchResult = {
  id: string;
  provider: PlaceProvider;
  providerPlaceId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  imageUrl?: string;
  openingHours?: string;
  description?: string;
  rating?: number;
  reviewCount?: number;
  category?: string;
};

export type TripBlockColorId =
  | "teal"
  | "cyan"
  | "blue"
  | "indigo"
  | "violet"
  | "rose"
  | "coral"
  | "amber"
  | "emerald"
  | "pine"
  | "navy"
  | "slate"
  | "plum"
  | "wine"
  | "brick"
  | "rust";

export type TripBlockKind = "itinerary" | "list";

export type TripDestination = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  country?: string;
};

/**
 * Where an anchor came from, which decides whether it can be shared.
 *
 * - `SAVED_PLACE` — the traveller's own address book (home, work). Personal, so
 *   it is stripped from anything published and replaced with a placeholder.
 * - `PLACE` — a provider place such as a hotel. Real itinerary content; this is
 *   what makes a shared template useful, so it travels with the trip.
 * - `MANUAL` — an ad-hoc pin the traveller typed. Travels.
 */
export type TripAnchorKind = "SAVED_PLACE" | "PLACE" | "MANUAL";

/** Where a day starts or ends. */
export type TripAnchor = {
  id: string;
  kind: TripAnchorKind;
  name: string;
  address?: string;
  lat: number;
  lng: number;
};

export type TripBlockData = {
  id: string;
  kind: TripBlockKind;
  title: string;
  date: string;
  colorId: TripBlockColorId;
  /** An explicit destination change; following days inherit it. */
  destination?: TripDestination | null;
  /**
   * Set only when this day does not start where the previous one ended.
   *
   * Normally absent: a day's start is derived from the day before, so the two
   * can never drift apart. Day one carries the trip origin here.
   */
  startAnchor?: TripAnchor | null;
  /** Where the day ends — usually the night's accommodation. */
  endAnchor?: TripAnchor | null;
  items: TripBlockItem[];
};

export type TripBlockItem = PlaceItem | NoteItem | ChecklistItem;

export type PlaceItem = {
  id: string;
  type: "place";
  placeId: string;
  name: string;
  description?: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  reviewCount?: number;
  imageUrl?: string;
  notes?: string;
  isVisited?: boolean;
  time?: string;
  timeEnd?: string;
  cost?: number;
  evCharger?: PlaceItemEvChargerDetails;
};

export type NoteItem = {
  id: string;
  type: "note";
  content: string;
};

export type ChecklistSubItem = {
  id: string;
  label: string;
  checked: boolean;
};

export type ChecklistItem = {
  id: string;
  type: "checklist";
  title: string;
  items: ChecklistSubItem[];
};

export type PremadeList = {
  id: string;
  title: string;
  items: string[];
};

export type ActiveSearch = {
  blockId: string;
  query: string;
  results: PlaceSearchResult[];
  selectedIndex: number;
};

export function isPlaceItem(item: TripBlockItem): item is PlaceItem {
  return item.type === "place";
}

export function isEvChargerPlaceItem(item: PlaceItem): boolean {
  return item.placeId.startsWith("ev-charger:");
}

export function isNoteItem(item: TripBlockItem): item is NoteItem {
  return item.type === "note";
}

export function isChecklistItem(item: TripBlockItem): item is ChecklistItem {
  return item.type === "checklist";
}

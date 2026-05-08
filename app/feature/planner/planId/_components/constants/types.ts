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

export type EvConnectorType = "CCS2" | "CHADEMO" | "TYPE2" | "NACS" | "GB_T";

export type EvChargerSource =
  | "GOOGLE_PLACES"
  | "OPENCHARGEMAP"
  | "ADMIN_IMPORT"
  | "USER_SUBMITTED"
  | "PARTNER_API";

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
};

export type EvChargerList = {
  items: EvCharger[];
  meta: {
    source: "local_cache";
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
  operatorName: string | null;
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

export type TripBlockData = {
  id: string;
  title: string;
  colorId: TripBlockColorId;
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
  imageUrl?: string;
  notes?: string;
  isVisited?: boolean;
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
  results: MockPlace[];
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

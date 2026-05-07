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

export type TripBlockData = {
  id: string;
  title: string;
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

export const mockTripBlocks: TripBlockData[] = [
  {
    id: "block-restaurants",
    title: "Restaurants",
    items: [],
  },
];

export const mockPlaceSuggestions: PlaceSuggestion[] = [
  { id: "suggestion-starbucks", label: "Starbucks", searchKey: "starbucks" },
  { id: "suggestion-staples", label: "Staples", searchKey: "staples" },
  { id: "suggestion-state-farm", label: "State Farm", searchKey: "state-farm" },
  { id: "suggestion-store", label: "Store", searchKey: "store" },
  { id: "suggestion-steakhouse", label: "Steakhouse", searchKey: "steakhouse" },
];

export const mockPlaceSearchResults: Record<string, MockPlace[]> = {
  starbucks: [
    {
      id: "starbucks-1",
      name: "Starbucks",
      description:
        "Seattle-based coffeehouse chain known for signature roasts and light bites.",
      address: "4790 S Broadway Ave, Tyler, TX 75703, USA",
      lat: 32.2767,
      lng: -95.3034,
      rating: 4.2,
      reviewCount: 210,
      category: "Coffee shop",
      priceLevel: "$$",
      imageUrl:
        "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=640&q=80",
      openingHours: "Open until 9:00 PM",
      phone: "+1 903-555-0148",
      website: "https://www.starbucks.com",
    },
    {
      id: "starbucks-2",
      name: "Starbucks",
      description: "Coffee, espresso drinks, tea, and quick breakfast options.",
      address: "123 Main Street, Dallas, TX 75201, USA",
      lat: 32.7767,
      lng: -96.797,
      rating: 4.4,
      reviewCount: 180,
      category: "Coffee shop",
      priceLevel: "$$",
      openingHours: "Open until 8:30 PM",
      phone: "+1 214-555-0197",
      website: "https://www.starbucks.com",
    },
    {
      id: "starbucks-3",
      name: "Starbucks",
      description: "Neighborhood cafe with cold brew, pastries, and seating.",
      address: "301 Commerce St, Fort Worth, TX 76102, USA",
      lat: 32.7555,
      lng: -97.3308,
      rating: 4.1,
      reviewCount: 143,
      category: "Coffee shop",
      priceLevel: "$$",
      openingHours: "Open until 7:00 PM",
      phone: "+1 817-555-0184",
      website: "https://www.starbucks.com",
    },
    {
      id: "starbucks-4",
      name: "Starbucks",
      description: "Drive-through coffee spot near shopping and hotels.",
      address: "7100 Preston Rd, Plano, TX 75024, USA",
      lat: 33.0742,
      lng: -96.7969,
      rating: 4.3,
      reviewCount: 256,
      category: "Coffee shop",
      priceLevel: "$$",
      openingHours: "Open until 9:30 PM",
      phone: "+1 972-555-0132",
      website: "https://www.starbucks.com",
    },
    {
      id: "starbucks-5",
      name: "Starbucks",
      description: "Central Austin cafe with mobile pickup and outdoor seats.",
      address: "600 Congress Ave, Austin, TX 78701, USA",
      lat: 30.2682,
      lng: -97.7429,
      rating: 4.5,
      reviewCount: 321,
      category: "Coffee shop",
      priceLevel: "$$",
      openingHours: "Open until 8:00 PM",
      phone: "+1 512-555-0161",
      website: "https://www.starbucks.com",
    },
    {
      id: "starbucks-6",
      name: "Starbucks",
      description: "Casual stop for espresso drinks and snack boxes.",
      address: "1120 S 5th St, Waco, TX 76706, USA",
      lat: 31.5459,
      lng: -97.1266,
      rating: 4.0,
      reviewCount: 98,
      category: "Coffee shop",
      priceLevel: "$$",
      openingHours: "Open until 7:30 PM",
      phone: "+1 254-555-0155",
      website: "https://www.starbucks.com",
    },
    {
      id: "starbucks-7",
      name: "Starbucks",
      description: "Downtown Houston coffee shop with quick service.",
      address: "910 Louisiana St, Houston, TX 77002, USA",
      lat: 29.7604,
      lng: -95.3698,
      rating: 4.2,
      reviewCount: 201,
      category: "Coffee shop",
      priceLevel: "$$",
      openingHours: "Open until 8:00 PM",
      phone: "+1 713-555-0104",
      website: "https://www.starbucks.com",
    },
    {
      id: "starbucks-8",
      name: "Starbucks",
      description: "River Walk area cafe for coffee and light bites.",
      address: "849 E Commerce St, San Antonio, TX 78205, USA",
      lat: 29.4241,
      lng: -98.4936,
      rating: 4.3,
      reviewCount: 174,
      category: "Coffee shop",
      priceLevel: "$$",
      openingHours: "Open until 9:00 PM",
      phone: "+1 210-555-0119",
      website: "https://www.starbucks.com",
    },
    {
      id: "starbucks-9",
      name: "Starbucks",
      description: "Coastal coffee stop near downtown Corpus Christi.",
      address: "401 N Shoreline Blvd, Corpus Christi, TX 78401, USA",
      lat: 27.8006,
      lng: -97.3964,
      rating: 4.1,
      reviewCount: 137,
      category: "Coffee shop",
      priceLevel: "$$",
      openingHours: "Open until 8:30 PM",
      phone: "+1 361-555-0142",
      website: "https://www.starbucks.com",
    },
  ],
  staples: [
    {
      id: "staples-1",
      name: "Staples",
      description: "Office supplies, shipping services, printing, and tech gear.",
      address: "321 Market Center Dr, Tyler, TX 75703, USA",
      lat: 32.2841,
      lng: -95.3062,
      rating: 4.0,
      reviewCount: 82,
      category: "Office supply store",
      priceLevel: "$$",
      openingHours: "Open until 8:00 PM",
      phone: "+1 903-555-0173",
      website: "https://www.staples.com",
    },
    {
      id: "staples-2",
      name: "Staples",
      description: "Printing, packing, and everyday office essentials.",
      address: "1901 N Central Expy, Plano, TX 75075, USA",
      lat: 33.0251,
      lng: -96.7102,
      rating: 4.1,
      reviewCount: 64,
      category: "Office supply store",
      priceLevel: "$$",
      openingHours: "Open until 9:00 PM",
      phone: "+1 972-555-0194",
      website: "https://www.staples.com",
    },
  ],
  "state-farm": [
    {
      id: "state-farm-1",
      name: "State Farm",
      description: "Insurance office for auto, home, renters, and life policies.",
      address: "205 S Broadway Ave, Tyler, TX 75702, USA",
      lat: 32.3502,
      lng: -95.3002,
      rating: 4.6,
      reviewCount: 39,
      category: "Insurance agency",
      openingHours: "Open until 5:00 PM",
      phone: "+1 903-555-0112",
      website: "https://www.statefarm.com",
    },
  ],
  store: [
    {
      id: "store-1",
      name: "Corner Store",
      description: "Convenience store for snacks, water, and travel basics.",
      address: "88 Garden Valley Rd, Tyler, TX 75702, USA",
      lat: 32.3637,
      lng: -95.2921,
      rating: 3.9,
      reviewCount: 45,
      category: "Convenience store",
      priceLevel: "$",
      openingHours: "Open 24 hours",
      phone: "+1 903-555-0126",
    },
    {
      id: "store-2",
      name: "Travel Market",
      description: "Quick stop for drinks, personal care, and road trip supplies.",
      address: "1420 E Front St, Tyler, TX 75702, USA",
      lat: 32.3509,
      lng: -95.2828,
      rating: 4.0,
      reviewCount: 58,
      category: "General store",
      priceLevel: "$",
      openingHours: "Open until 11:00 PM",
      phone: "+1 903-555-0166",
    },
  ],
  steakhouse: [
    {
      id: "steakhouse-1",
      name: "Prime Trail Steakhouse",
      description: "Classic steakhouse with grilled cuts, sides, and cocktails.",
      address: "2200 WSW Loop 323, Tyler, TX 75701, USA",
      lat: 32.3215,
      lng: -95.3344,
      rating: 4.7,
      reviewCount: 344,
      category: "Steakhouse",
      priceLevel: "$$$",
      imageUrl:
        "https://images.unsplash.com/photo-1544025162-d76694265947?w=640&q=80",
      openingHours: "Open until 10:00 PM",
      phone: "+1 903-555-0188",
      website: "https://example.com/prime-trail",
    },
    {
      id: "steakhouse-2",
      name: "Oak Ember Grill",
      description: "Upscale grill with steaks, seafood, and a quiet dining room.",
      address: "110 N College Ave, Tyler, TX 75702, USA",
      lat: 32.3518,
      lng: -95.3016,
      rating: 4.5,
      reviewCount: 211,
      category: "Steakhouse",
      priceLevel: "$$$",
      openingHours: "Open until 10:30 PM",
      phone: "+1 903-555-0191",
      website: "https://example.com/oak-ember",
    },
  ],
};

const mockEvChargers: EvCharger[] = [
  {
    id: "charger-tyler-broadway-supercharge",
    name: "Broadway EV Supercharge",
    operatorName: "Navio Charge",
    location: {
      lat: 32.2796,
      lng: -95.3049,
      address: "4815 S Broadway Ave, Tyler, TX 75703, USA",
      placeId: "mock-charger-tyler-broadway",
    },
    address: "4815 S Broadway Ave, Tyler, TX 75703, USA",
    province: "Texas",
    connectorTypes: ["CCS2", "TYPE2"],
    maxKw: 120,
    totalConnectors: 8,
    availableConnectors: 5,
    priceText: "$0.36/kWh",
    openingHours: { summary: "Open 24 hours" },
    source: "ADMIN_IMPORT",
    verificationStatus: "ADMIN_VERIFIED",
    status: "active",
    ratingAvg: 4.6,
    ratingCount: 42,
    confidenceScore: 0.94,
    stale: false,
  },
  {
    id: "charger-tyler-loop-fast-charge",
    name: "Loop 323 Fast Charge",
    operatorName: "VoltWay",
    location: {
      lat: 32.3228,
      lng: -95.3332,
      address: "2180 WSW Loop 323, Tyler, TX 75701, USA",
      placeId: "mock-charger-tyler-loop",
    },
    address: "2180 WSW Loop 323, Tyler, TX 75701, USA",
    province: "Texas",
    connectorTypes: ["CCS2", "CHADEMO"],
    maxKw: 150,
    totalConnectors: 6,
    availableConnectors: 2,
    priceText: "$0.42/kWh",
    openingHours: { summary: "Open 24 hours" },
    source: "GOOGLE_PLACES",
    verificationStatus: "GOOGLE_CACHED",
    status: "active",
    ratingAvg: 4.3,
    ratingCount: 31,
    confidenceScore: 0.86,
    stale: false,
  },
  {
    id: "charger-tyler-downtown-type2",
    name: "Downtown Tyler Charge Point",
    operatorName: "City Parking",
    location: {
      lat: 32.3511,
      lng: -95.3006,
      address: "120 N College Ave, Tyler, TX 75702, USA",
      placeId: "mock-charger-tyler-downtown",
    },
    address: "120 N College Ave, Tyler, TX 75702, USA",
    province: "Texas",
    connectorTypes: ["TYPE2"],
    maxKw: 22,
    totalConnectors: 4,
    availableConnectors: 1,
    priceText: "Free for first 2 hours",
    openingHours: { summary: "6:00 AM - 11:00 PM" },
    source: "USER_SUBMITTED",
    verificationStatus: "USER_VERIFIED",
    status: "active",
    ratingAvg: 4.1,
    ratingCount: 18,
    confidenceScore: 0.78,
    stale: false,
  },
  {
    id: "charger-dallas-main-hub",
    name: "Main Street Charging Hub",
    operatorName: "Electra",
    location: {
      lat: 32.7755,
      lng: -96.7991,
      address: "132 Main Street, Dallas, TX 75201, USA",
      placeId: "mock-charger-dallas-main",
    },
    address: "132 Main Street, Dallas, TX 75201, USA",
    province: "Texas",
    connectorTypes: ["CCS2", "NACS"],
    maxKw: 250,
    totalConnectors: 12,
    availableConnectors: 7,
    priceText: "$0.45/kWh",
    openingHours: { summary: "Open 24 hours" },
    source: "ADMIN_IMPORT",
    verificationStatus: "ADMIN_VERIFIED",
    status: "active",
    ratingAvg: 4.7,
    ratingCount: 89,
    confidenceScore: 0.97,
    stale: false,
  },
  {
    id: "charger-plano-preston-rapid",
    name: "Preston Rapid Charge",
    operatorName: "ChargeGrid",
    location: {
      lat: 33.0753,
      lng: -96.7953,
      address: "7120 Preston Rd, Plano, TX 75024, USA",
      placeId: "mock-charger-plano-preston",
    },
    address: "7120 Preston Rd, Plano, TX 75024, USA",
    province: "Texas",
    connectorTypes: ["CCS2", "TYPE2"],
    maxKw: 180,
    totalConnectors: 10,
    availableConnectors: 4,
    priceText: "$0.39/kWh",
    openingHours: { summary: "Open 24 hours" },
    source: "GOOGLE_PLACES",
    verificationStatus: "GOOGLE_CACHED",
    status: "active",
    ratingAvg: 4.4,
    ratingCount: 53,
    confidenceScore: 0.88,
    stale: false,
  },
  {
    id: "charger-austin-congress-fast",
    name: "Congress Avenue EV Fast Stop",
    operatorName: "Navio Charge",
    location: {
      lat: 30.2695,
      lng: -97.744,
      address: "620 Congress Ave, Austin, TX 78701, USA",
      placeId: "mock-charger-austin-congress",
    },
    address: "620 Congress Ave, Austin, TX 78701, USA",
    province: "Texas",
    connectorTypes: ["CCS2", "NACS"],
    maxKw: 200,
    totalConnectors: 8,
    availableConnectors: 3,
    priceText: "$0.41/kWh",
    openingHours: { summary: "Open 24 hours" },
    source: "ADMIN_IMPORT",
    verificationStatus: "ADMIN_VERIFIED",
    status: "active",
    ratingAvg: 4.5,
    ratingCount: 66,
    confidenceScore: 0.93,
    stale: false,
  },
  {
    id: "charger-bangkok-siam-rapid",
    name: "Siam Rapid Charge",
    operatorName: "EA Anywhere",
    location: {
      lat: 13.7466,
      lng: 100.5347,
      address: "Rama I Rd, Pathum Wan, Bangkok 10330, Thailand",
      placeId: "mock-charger-bangkok-siam",
    },
    address: "Rama I Rd, Pathum Wan, Bangkok 10330, Thailand",
    province: "Bangkok",
    connectorTypes: ["CCS2", "CHADEMO", "TYPE2"],
    maxKw: 120,
    totalConnectors: 10,
    availableConnectors: 6,
    priceText: "THB 8.50/kWh",
    openingHours: { summary: "Open 24 hours" },
    source: "ADMIN_IMPORT",
    verificationStatus: "ADMIN_VERIFIED",
    status: "active",
    ratingAvg: 4.6,
    ratingCount: 74,
    confidenceScore: 0.95,
    stale: false,
  },
  {
    id: "charger-bangkok-riverside",
    name: "Riverside EV Station",
    operatorName: "PEA Volta",
    location: {
      lat: 13.7311,
      lng: 100.5142,
      address: "Charoen Krung Rd, Bang Rak, Bangkok 10500, Thailand",
      placeId: "mock-charger-bangkok-riverside",
    },
    address: "Charoen Krung Rd, Bang Rak, Bangkok 10500, Thailand",
    province: "Bangkok",
    connectorTypes: ["CCS2", "TYPE2"],
    maxKw: 80,
    totalConnectors: 6,
    availableConnectors: 2,
    priceText: "THB 7.90/kWh",
    openingHours: { summary: "7:00 AM - 11:00 PM" },
    source: "USER_SUBMITTED",
    verificationStatus: "USER_VERIFIED",
    status: "active",
    ratingAvg: 4.2,
    ratingCount: 19,
    confidenceScore: 0.8,
    stale: false,
  },
];

export const mockPremadeLists: PremadeList[] = [
  {
    id: "backpack-pack",
    title: "Backpack Pack",
    items: [
      "Passport / ID",
      "Wallet",
      "Phone charger",
      "Power bank",
      "Water bottle",
      "Headphones",
      "Tissues",
      "Medicine",
      "Sunglasses",
      "Snacks",
    ],
  },
  {
    id: "beach-day",
    title: "Beach Day",
    items: [
      "Swimsuit",
      "Sunscreen",
      "Beach towel",
      "Sandals",
      "Hat",
      "Water bottle",
      "Dry bag",
      "Change of clothes",
    ],
  },
  {
    id: "hotel-stay",
    title: "Hotel Stay",
    items: [
      "Clothes",
      "Toothbrush",
      "Toothpaste",
      "Skincare",
      "Sleepwear",
      "Phone charger",
      "Booking confirmation",
    ],
  },
  {
    id: "road-trip",
    title: "Road Trip",
    items: [
      "Driver license",
      "Car documents",
      "Sunglasses",
      "Snacks",
      "Water",
      "Aux cable",
      "Emergency cash",
      "First-aid kit",
    ],
  },
  {
    id: "camera-gear",
    title: "Camera Gear",
    items: [
      "Camera body",
      "Lens cloth",
      "Extra batteries",
      "Memory cards",
      "Tripod",
      "Charger",
      "Camera strap",
    ],
  },
  {
    id: "camping",
    title: "Camping",
    items: [
      "Tent",
      "Sleeping bag",
      "Headlamp",
      "Bug spray",
      "Matches",
      "Cookware",
      "Trash bags",
      "Warm layer",
    ],
  },
];

export function isPlaceItem(item: TripBlockItem): item is PlaceItem {
  return item.type === "place";
}

export function isNoteItem(item: TripBlockItem): item is NoteItem {
  return item.type === "note";
}

export function isChecklistItem(item: TripBlockItem): item is ChecklistItem {
  return item.type === "checklist";
}

export function getPlaceSuggestions(query: string): PlaceSuggestion[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  return mockPlaceSuggestions.filter((suggestion) =>
    suggestion.label.toLowerCase().includes(normalizedQuery),
  );
}

export function getPlaceResults(searchKey: string): MockPlace[] {
  return mockPlaceSearchResults[searchKey] ?? [];
}

export function getDistanceKm(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): number {
  const earthRadiusKm = 6371;
  const latDelta = ((to.lat - from.lat) * Math.PI) / 180;
  const lngDelta = ((to.lng - from.lng) * Math.PI) / 180;
  const fromLat = (from.lat * Math.PI) / 180;
  const toLat = (to.lat * Math.PI) / 180;
  const haversine =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(fromLat) *
      Math.cos(toLat) *
      Math.sin(lngDelta / 2) *
      Math.sin(lngDelta / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export async function getEvChargersNear({
  lat,
  lng,
  radiusKm = 8,
}: GetEvChargersNearParams): Promise<EvChargerList> {
  const items = mockEvChargers.filter(
    (charger) => getDistanceKm({ lat, lng }, charger.location) <= radiusKm,
  );

  return {
    items,
    meta: {
      source: "local_cache",
      tileKey: `mock_${lat.toFixed(2)}_${lng.toFixed(2)}`,
      stale: items.some((charger) => charger.stale),
      refreshed: false,
    },
  };
}

export function getExploreItems(destinationName: string): ExploreItem[] {
  return [
    {
      id: "attractions",
      title: `Best attractions in ${destinationName}`,
      subtitle: "Most often-seen on the web",
      source: "Navio",
      imageUrl:
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80",
      gradient:
        "linear-gradient(135deg, oklch(0.85 0.08 145) 0%, oklch(0.68 0.16 155) 100%)",
    },
    {
      id: "restaurants",
      title: `Best restaurants in ${destinationName}`,
      subtitle: "Most often-seen on the web",
      source: "Navio",
      imageUrl:
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80",
      gradient:
        "linear-gradient(135deg, oklch(0.92 0.08 60) 0%, oklch(0.75 0.15 40) 100%)",
    },
    {
      id: "hotels",
      title: "Search hotels with transparent pricing",
      subtitle: "We don't sort based on commissions",
      source: "Navio",
      imageUrl:
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&q=80",
      gradient:
        "linear-gradient(135deg, oklch(0.88 0.06 240) 0%, oklch(0.7 0.12 250) 100%)",
    },
    {
      id: "activities",
      title: `Top activities in ${destinationName}`,
      subtitle: "Local experiences you'll love",
      source: "Navio",
      imageUrl:
        "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=80",
      gradient:
        "linear-gradient(135deg, oklch(0.9 0.06 300) 0%, oklch(0.72 0.1 290) 100%)",
    },
  ];
}

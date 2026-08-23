export type UserProfile = {
  id: string;
  name: string;
  avatarUrl: string;
};

export type PlanGarage = {
  make: string;
  model: string;
  year: number;
  trim?: string;
  batteryCapacityKwh: number;
  rangeKm: number;
  connectorType: string;
  color?: string;
  imageUrl?: string;
};

export type PlanExpenseItem = {
  id: string;
  name: string;
  category:
    | "accommodation"
    | "food"
    | "activities"
    | "transport"
    | "shopping"
    | "charging"
    | "other";
  amount: number;
  currency: string;
  date?: string;
};

export type PlanBudget = {
  total: number;
  currency: string;
  items: PlanExpenseItem[];
};

export type Plan = {
  id: string;
  title: string;
  province: string;
  description: string;
  location: string;
  creator: string;
  tags: string[];
  rating: number;
  reviews: number;
  lastUpdated: string;
  imageUrl: string;
  authorId: string;
  likes: number;
  views: number;
  isTrending: boolean;
  templateStartDate?: string;
  templateEndDate?: string;
  garage?: PlanGarage;
  budget?: PlanBudget;
};

export type PlanTemplatePlace = {
  id: string;
  name: string;
  description?: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  reviewCount?: number;
  imageUrl?: string;
  time?: string;
  timeEnd?: string;
  notes?: string;
  isVisited?: boolean;
  cost?: number;
  isEvCharger?: boolean;
  evConnectors?: string;
  evPowerKw?: number;
};

export type PlanTemplateBlock = {
  id: string;
  title: string;
  type?: "itinerary" | "list";
  date?: string;
  places: PlanTemplatePlace[];
};

const USERS: UserProfile[] = [
  {
    id: "u1",
    name: "Kanya S.",
    avatarUrl:
      "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=facearea&w=96&h=96",
  },
  {
    id: "u2",
    name: "Narin P.",
    avatarUrl:
      "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=facearea&w=96&h=96",
  },
  {
    id: "u3",
    name: "Pimchanok R.",
    avatarUrl:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=facearea&w=96&h=96",
  },
  {
    id: "u4",
    name: "Arthit K.",
    avatarUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=facearea&w=96&h=96",
  },
];

export const PLANS: Plan[] = [
  {
    id: "101",
    title:
      "Chiang Mai to Pai Escape: Highlands, hot springs, and quiet EV stops",
    province: "Chiang Mai",
    description:
      "A relaxed 3-day mountain loop that balances winding scenic roads with slow mornings, local coffee roasters, and EV-friendly pauses at viewpoints along the way.",
    location: "Chiang Mai, Thailand",
    creator: "Kanya S.",
    tags: [
      "Long Trip",
      "Nature",
      "Peaceful",
      "Mountain",
      "Forest",
      "Hiking",
      "Cafe",
    ],
    rating: 4.8,
    reviews: 1320,
    lastUpdated: "25 Nov 2026",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80",
    authorId: "u1",
    likes: 1624,
    views: 12840,
    isTrending: true,
  },
  {
    id: "102",
    title:
      "Phuket Coastal Drive: West coast beaches, sunset rides, and food markets",
    province: "Phuket",
    description:
      "Cruise Phuket's west coast with late afternoon beach stops, sunset lookouts, and a curated list of island food markets that are easy to reach by EV.",
    location: "Phuket, Thailand",
    creator: "Narin P.",
    tags: ["Long Trip", "Food Focus", "Chilling", "Diving", "Cafe", "Beach"],
    rating: 4.7,
    reviews: 980,
    lastUpdated: "18 Oct 2026",
    imageUrl:
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=800&q=80",
    authorId: "u2",
    likes: 980,
    views: 9420,
    isTrending: true,
  },
  {
    id: "103",
    title:
      "Bangkok Night Planner: Rooftops, night markets, and riverside loops",
    province: "Bangkok",
    description:
      "A night-friendly EV route through rooftop views, lively markets, and riverside pullovers, designed to avoid traffic peaks and maximize neon-city energy.",
    location: "Bangkok, Thailand",
    creator: "Pimchanok R.",
    tags: ["Short Trip", "Food Focus", "Chilling", "Restaurant"],
    rating: 4.6,
    reviews: 1105,
    lastUpdated: "2 Dec 2026",
    imageUrl:
      "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=800&q=80",
    authorId: "u3",
    likes: 1320,
    views: 11005,
    isTrending: true,
  },
  {
    id: "104",
    title: "Krabi Island Hop: Clifftop viewpoints, lagoons, and calm beaches",
    province: "Krabi",
    description:
      "Base in Krabi and explore cliffside viewpoints, hidden lagoons, and calm beaches with a balanced route that keeps charging and driving time comfortable.",
    location: "Krabi, Thailand",
    creator: "Arthit K.",
    tags: ["Long Trip", "Nature", "Beach", "Diving", "Waterfall"],
    rating: 4.9,
    reviews: 1540,
    lastUpdated: "11 Nov 2026",
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    authorId: "u4",
    likes: 1460,
    views: 11650,
    isTrending: true,
  },
  {
    id: "109",
    title: "Koh Lanta Quiet Bays: A slow coastal loop with cafe breaks",
    province: "Krabi",
    description:
      "A laid-back coastal loop that prioritizes calm beaches, small cafes, and scenic pullouts while keeping the EV itinerary simple and predictable.",
    location: "Koh Lanta, Thailand",
    creator: "Kanya S.",
    tags: ["Short Trip", "Chilling", "Peaceful", "Cafe", "Beach"],
    rating: 4.5,
    reviews: 860,
    lastUpdated: "6 Sep 2026",
    imageUrl:
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=800&q=80",
    authorId: "u1",
    likes: 1180,
    views: 9720,
    isTrending: true,
  },
  {
    id: "110",
    title: "Khao Yai Scenic Run: Vineyards, waterfalls, and forest roads",
    province: "Khao Yai",
    description:
      "A day-trip focused route through vineyards, waterfalls, and forest roads, with EV-friendly stops timed for easy mid-day charging.",
    location: "Khao Yai, Thailand",
    creator: "Narin P.",
    tags: ["Short Trip", "Nature", "Forest", "Waterfall", "Hiking"],
    rating: 4.7,
    reviews: 905,
    lastUpdated: "29 Oct 2026",
    imageUrl:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80",
    authorId: "u2",
    likes: 990,
    views: 8450,
    isTrending: true,
  },
  {
    id: "105",
    title:
      "Chiang Rai Culture Trail: Temples, tea farms, and local craft villages",
    province: "Chiang Rai",
    description:
      "A slow and scenic route across Northern Thailand featuring temples, tea farms, and local craft villages, with plenty of time for quiet stops.",
    location: "Chiang Rai, Thailand",
    creator: "Narin P.",
    tags: ["Long Trip", "Peaceful", "Nature", "Mountain", "Cafe"],
    rating: 4.6,
    reviews: 640,
    lastUpdated: "7 Aug 2026",
    imageUrl:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
    authorId: "u2",
    likes: 512,
    views: 4810,
    isTrending: false,
  },
  {
    id: "106",
    title: "Hua Hin Weekend Calm: Seaside cafes, sunset rides, and easy stays",
    province: "Hua Hin",
    description:
      "Two days of seaside cafes, sunset rides, and EV-friendly hotels, ideal for a low-effort getaway with a light charging schedule.",
    location: "Hua Hin, Thailand",
    creator: "Kanya S.",
    tags: ["Short Trip", "Chilling", "Restaurant", "Cafe", "Beach"],
    rating: 4.5,
    reviews: 712,
    lastUpdated: "14 Nov 2026",
    imageUrl:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80",
    authorId: "u1",
    likes: 742,
    views: 6230,
    isTrending: false,
  },
  {
    id: "107",
    title: "Kanchanaburi River Run: Bridge history and riverside stays",
    province: "Kanchanaburi",
    description:
      "Bridge history, riverside stays, and an easy EV itinerary that keeps you close to the water and away from heavy city traffic.",
    location: "Kanchanaburi, Thailand",
    creator: "Pimchanok R.",
    tags: ["Short Trip", "Peaceful", "Nature", "Forest"],
    rating: 4.4,
    reviews: 590,
    lastUpdated: "21 Jul 2026",
    imageUrl:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80",
    authorId: "u3",
    likes: 680,
    views: 5840,
    isTrending: false,
  },
  {
    id: "108",
    title: "Samui Slow Travel: Beaches, hidden cafes, and quiet inland roads",
    province: "Koh Samui",
    description:
      "A chilled island route with beach time, hidden cafes, and quiet inland roads, designed for a smooth EV pace.",
    location: "Koh Samui, Thailand",
    creator: "Arthit K.",
    tags: ["Short Trip", "Chilling", "Cafe", "Diving", "Beach"],
    rating: 4.6,
    reviews: 820,
    lastUpdated: "9 Sep 2026",
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    authorId: "u4",
    likes: 920,
    views: 8120,
    isTrending: false,
  },
  {
    id: "111",
    title: "Ayutthaya Heritage Loop: Riverside ruins and sunset temples",
    province: "Ayutthaya",
    description:
      "A full-day circuit through riverside ruins, sunset temples, and local food stops, with a simple EV charging plan to keep the day effortless.",
    location: "Ayutthaya, Thailand",
    creator: "Kanya S.",
    tags: ["Short Trip", "Peaceful", "Restaurant", "Cafe"],
    rating: 4.3,
    reviews: 520,
    lastUpdated: "3 Jun 2026",
    imageUrl:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80",
    authorId: "u1",
    likes: 604,
    views: 5200,
    isTrending: false,
  },
  {
    id: "112",
    title: "Sukhothai Morning Ride: Old city parks and lotus lakes",
    province: "Sukhothai",
    description:
      "A morning-focused route through old city parks, lotus lakes, and quiet temples, designed for easy EV pacing and golden-hour photos.",
    location: "Sukhothai, Thailand",
    creator: "Narin P.",
    tags: ["Short Trip", "Peaceful", "Nature", "Forest"],
    rating: 4.4,
    reviews: 480,
    lastUpdated: "19 May 2026",
    imageUrl:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
    authorId: "u2",
    likes: 488,
    views: 4360,
    isTrending: false,
  },
  {
    id: "113",
    title: "Pattaya Coastline Reset: Short hops and late-night seafood",
    province: "Pattaya",
    description:
      "A short-hop coastal plan that blends beach time with late-night seafood, keeping the EV schedule simple and flexible.",
    location: "Pattaya, Thailand",
    creator: "Pimchanok R.",
    tags: ["Short Trip", "Food Focus", "Chilling", "Restaurant", "Beach"],
    rating: 4.2,
    reviews: 540,
    lastUpdated: "28 Aug 2026",
    imageUrl:
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80",
    authorId: "u3",
    likes: 540,
    views: 4920,
    isTrending: false,
  },
  {
    id: "114",
    title: "Mae Hong Son Mist Trail: Curves, coffee, and hilltop stops",
    province: "Mae Hong Son",
    description:
      "A winding, misty route with coffee pauses and hilltop views, built around manageable EV stretches and scenic breaks.",
    location: "Mae Hong Son, Thailand",
    creator: "Arthit K.",
    tags: ["Long Trip", "Mountain", "Forest", "Hiking", "Peaceful"],
    rating: 4.7,
    reviews: 670,
    lastUpdated: "5 Nov 2026",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    authorId: "u4",
    likes: 710,
    views: 6030,
    isTrending: false,
  },
  {
    id: "115",
    title: "Khao Sok Lake Day: Floating rafts and jungle inlets",
    province: "Khao Sok",
    description:
      "A day plan focused on lake viewpoints, floating raft stays, and quiet jungle inlets, with EV stops timed around the park visit.",
    location: "Khao Sok, Thailand",
    creator: "Kanya S.",
    tags: ["Short Trip", "Nature", "Forest", "Waterfall", "Chilling"],
    rating: 4.8,
    reviews: 740,
    lastUpdated: "16 Nov 2026",
    imageUrl:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80",
    authorId: "u1",
    likes: 682,
    views: 5590,
    isTrending: false,
  },
  {
    id: "116",
    title: "Rayong Beach Day: Short drives and local seafood spots",
    province: "Rayong",
    description:
      "A low-effort beach day with short drives and local seafood spots, ideal for a relaxed EV itinerary with minimal detours.",
    location: "Rayong, Thailand",
    creator: "Narin P.",
    tags: ["Short Trip", "Food Focus", "Restaurant", "Beach", "Chilling"],
    rating: 4.3,
    reviews: 510,
    lastUpdated: "12 Oct 2026",
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    authorId: "u2",
    likes: 504,
    views: 4710,
    isTrending: false,
  },
  {
    id: "117",
    title: "Phang Nga Viewpoint Run: Limestone cliffs and island detours",
    province: "Phang Nga",
    description:
      "A scenic loop with limestone cliffs, island detours, and calm viewpoints, keeping the EV route steady and photo-friendly.",
    location: "Phang Nga, Thailand",
    creator: "Pimchanok R.",
    tags: ["Short Trip", "Nature", "Mountain", "Waterfall", "Peaceful"],
    rating: 4.5,
    reviews: 560,
    lastUpdated: "1 Nov 2026",
    imageUrl:
      "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80",
    authorId: "u3",
    likes: 590,
    views: 4980,
    isTrending: false,
  },
  {
    id: "200",
    title:
      "Bangkok 5-Day EV Loop: Temples, markets, riverside, and Ayutthaya day trip",
    province: "Bangkok",
    description:
      "A complete 5-day Bangkok experience — old-city temples, modern riverside malls, art galleries, the legendary Chatuchak market, and a day trip to Ayutthaya. Every EV charging stop is mapped and timed.",
    location: "Bangkok, Thailand",
    creator: "Kanya S.",
    tags: [
      "Long Trip",
      "Food Focus",
      "Restaurant",
      "Cafe",
      "Nature",
      "History",
    ],
    rating: 4.9,
    reviews: 2840,
    lastUpdated: "10 May 2026",
    imageUrl:
      "https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=1200&q=80",
    authorId: "u1",
    likes: 3210,
    views: 28400,
    isTrending: true,
    templateStartDate: "2025-05-13",
    templateEndDate: "2025-05-17",
    garage: {
      make: "Tesla",
      model: "Model 3",
      year: 2023,
      trim: "Long Range AWD",
      batteryCapacityKwh: 82,
      rangeKm: 614,
      connectorType: "CCS2",
      color: "Pearl White Multi-Coat",
    },
    budget: {
      total: 35000,
      currency: "THB",
      items: [
        {
          id: "exp-1",
          name: "Hotel Riva Surya Bangkok (4 nights)",
          category: "accommodation",
          amount: 12800,
          currency: "THB",
          date: "2025-05-13",
        },
        {
          id: "exp-2",
          name: "Grand Palace + Wat Pho entrance fees",
          category: "activities",
          amount: 700,
          currency: "THB",
          date: "2025-05-13",
        },
        {
          id: "exp-3",
          name: "Day 1–2 meals (riverside & ICONSIAM)",
          category: "food",
          amount: 3200,
          currency: "THB",
          date: "2025-05-13",
        },
        {
          id: "exp-4",
          name: "ICONSIAM & EmQuartier shopping",
          category: "shopping",
          amount: 5400,
          currency: "THB",
          date: "2025-05-14",
        },
        {
          id: "exp-5",
          name: "Chatuchak & Or Tor Kor market finds",
          category: "shopping",
          amount: 2600,
          currency: "THB",
          date: "2025-05-15",
        },
        {
          id: "exp-6",
          name: "Ayutthaya day trip (van + entrance fees)",
          category: "transport",
          amount: 1800,
          currency: "THB",
          date: "2025-05-17",
        },
        {
          id: "exp-7",
          name: "EV charging (all 10 stations, 5 days)",
          category: "charging",
          amount: 980,
          currency: "THB",
          date: "2025-05-13",
        },
      ],
    },
  },
];

export const TRENDING_PLANS = PLANS.filter((plan) => plan.isTrending);
export const RECENT_PLANS = PLANS.filter((plan) => !plan.isTrending);

const PROVINCE_CENTERS: Record<string, { lat: number; lng: number }> = {
  Ayutthaya: { lat: 14.3532, lng: 100.5689 },
  Bangkok: { lat: 13.7563, lng: 100.5018 },
  "Chiang Mai": { lat: 18.7883, lng: 98.9853 },
  "Chiang Rai": { lat: 19.9105, lng: 99.8406 },
  "Hua Hin": { lat: 12.5684, lng: 99.9577 },
  Kanchanaburi: { lat: 14.0228, lng: 99.5328 },
  "Khao Sok": { lat: 8.9082, lng: 98.5307 },
  "Khao Yai": { lat: 14.4391, lng: 101.3725 },
  "Koh Samui": { lat: 9.512, lng: 100.0136 },
  Krabi: { lat: 8.0863, lng: 98.9063 },
  "Mae Hong Son": { lat: 19.302, lng: 97.9654 },
  Pattaya: { lat: 12.9236, lng: 100.8825 },
  "Phang Nga": { lat: 8.4501, lng: 98.5255 },
  Phuket: { lat: 7.8804, lng: 98.3923 },
  Rayong: { lat: 12.6814, lng: 101.2816 },
  Sukhothai: { lat: 17.0078, lng: 99.823 },
};

const PLAN_TEMPLATE_BLOCKS: Record<string, PlanTemplateBlock[]> = {
  "101": [
    {
      id: "chiang-mai-highlands",
      title: "Highlands, coffee, and viewpoints",
      places: [
        {
          id: "tha-phae-gate",
          name: "Tha Phae Gate",
          description: "Old city start",
          address: "Tha Phae Road, Chiang Mai",
          lat: 18.7883,
          lng: 98.9937,
          rating: 4.4,
          reviewCount: 12400,
        },
        {
          id: "doi-suthep-viewpoint",
          name: "Wat Phra That Doi Suthep",
          description: "Mountain temple",
          address: "Suthep, Mueang Chiang Mai",
          lat: 18.8049,
          lng: 98.9216,
          rating: 4.7,
          reviewCount: 32100,
        },
        {
          id: "pai-canyon",
          name: "Pai Canyon",
          description: "Sunset stop",
          address: "Mae Hi, Pai, Mae Hong Son",
          lat: 19.3199,
          lng: 98.4525,
          rating: 4.5,
          reviewCount: 7800,
        },
      ],
    },
  ],
  "102": [
    {
      id: "phuket-coast",
      title: "Beach stops and night food",
      places: [
        {
          id: "phuket-old-town",
          name: "Phuket Old Town",
          description: "Cafe walk",
          address: "Mueang Phuket District, Phuket",
          lat: 7.884,
          lng: 98.3889,
          rating: 4.5,
          reviewCount: 18300,
        },
        {
          id: "karon-viewpoint",
          name: "Karon Viewpoint",
          description: "Coastal view",
          address: "Karon, Mueang Phuket District",
          lat: 7.8057,
          lng: 98.3036,
          rating: 4.5,
          reviewCount: 9800,
        },
        {
          id: "promthep-cape",
          name: "Promthep Cape",
          description: "Sunset",
          address: "Rawai, Mueang Phuket District",
          lat: 7.7623,
          lng: 98.3051,
          rating: 4.6,
          reviewCount: 14600,
        },
      ],
    },
  ],
  "103": [
    {
      id: "bangkok-night",
      title: "Riverside lights and night markets",
      places: [
        {
          id: "wat-arun",
          name: "Wat Arun",
          description: "Riverside icon",
          address: "Bangkok Yai, Bangkok",
          lat: 13.7437,
          lng: 100.4889,
          rating: 4.6,
          reviewCount: 45200,
        },
        {
          id: "iconsiam",
          name: "ICONSIAM",
          description: "Dinner stop",
          address: "Khlong San, Bangkok",
          lat: 13.7262,
          lng: 100.5104,
          rating: 4.6,
          reviewCount: 58300,
        },
        {
          id: "jodd-fairs",
          name: "JODD FAIRS Rama 9",
          description: "Night market",
          address: "Huai Khwang, Bangkok",
          lat: 13.7595,
          lng: 100.5669,
          rating: 4.3,
          reviewCount: 19600,
        },
      ],
    },
  ],
  "104": [
    {
      id: "krabi-cliffs",
      title: "Cliffs, beaches, and forest water",
      places: [
        {
          id: "ao-nang-beach",
          name: "Ao Nang Beach",
          description: "Beach base",
          address: "Ao Nang, Krabi",
          lat: 8.0341,
          lng: 98.8179,
          rating: 4.3,
          reviewCount: 21100,
        },
        {
          id: "railay-beach",
          name: "Railay Beach",
          description: "Limestone cliffs",
          address: "Ao Nang, Krabi",
          lat: 8.0116,
          lng: 98.8376,
          rating: 4.6,
          reviewCount: 17300,
        },
        {
          id: "emerald-pool",
          name: "Emerald Pool",
          description: "Forest swim",
          address: "Khlong Thom, Krabi",
          lat: 7.9253,
          lng: 99.2683,
          rating: 4.3,
          reviewCount: 8800,
        },
      ],
    },
  ],
  "200": [
    /* ── Day 1 (May 13) — Old City & Temples ── */
    {
      id: "200-day1",
      type: "itinerary",
      date: "2025-05-13",
      title: "Day 1 — Old City & Temples",
      places: [
        {
          id: "200-grand-palace",
          name: "Grand Palace",
          description: "Royal complex",
          address: "Na Phra Lan Rd, Phra Nakhon, Bangkok 10200",
          lat: 13.75,
          lng: 100.4913,
          rating: 4.6,
          reviewCount: 98400,
          imageUrl:
            "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=800&q=80",
          time: "09:00",
          timeEnd: "11:00",
          cost: 500,
          isVisited: true,
          notes:
            "Book tickets online to skip the queue. Dress code enforced — bring a sarong just in case.",
        },
        {
          id: "200-wat-pho",
          name: "Wat Pho (Temple of the Reclining Buddha)",
          description: "Temple",
          address: "2 Sanam Chai Rd, Phra Nakhon, Bangkok 10200",
          lat: 13.7467,
          lng: 100.493,
          rating: 4.6,
          reviewCount: 71200,
          imageUrl:
            "https://images.unsplash.com/photo-1563491945-14abb8ac5965?auto=format&fit=crop&w=800&q=80",
          time: "11:15",
          timeEnd: "12:30",
          cost: 200,
          isVisited: true,
        },
        {
          id: "200-tha-maharaj",
          name: "Tha Maharaj Pier & Market",
          description: "Riverside cafe",
          address: "1/11 Na Phra That Alley, Phra Nakhon, Bangkok 10200",
          lat: 13.7495,
          lng: 100.4895,
          rating: 4.3,
          reviewCount: 18600,
          imageUrl:
            "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80",
          time: "12:45",
          timeEnd: "13:45",
          notes: "Great riverside lunch spot. Try the pad kra pao at the market stalls.",
        },
        {
          id: "200-wat-arun",
          name: "Wat Arun (Temple of Dawn)",
          description: "Riverside icon",
          address: "158 Wang Doem Rd, Bangkok Yai, Bangkok 10600",
          lat: 13.7437,
          lng: 100.4889,
          rating: 4.6,
          reviewCount: 45200,
          imageUrl:
            "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=800&q=80",
          time: "14:00",
          timeEnd: "15:30",
          cost: 100,
        },
        {
          id: "200-ev-centralworld-d1",
          name: "EA Anywhere @ CentralWorld",
          description: "EV Charging",
          address: "4/1-4/2 Ratchadamri Rd, Pathum Wan, Bangkok 10330",
          lat: 13.7471,
          lng: 100.5393,
          rating: 4.3,
          reviewCount: 1240,
          isEvCharger: true,
          evConnectors: "CCS2, Type 2",
          evPowerKw: 50,
          time: "16:00",
          timeEnd: "16:45",
          notes: "B2 basement level, near the east parking entrance. Usually 4 of 6 bays free at this hour.",
        },
        {
          id: "200-khao-san",
          name: "Khao San Road",
          description: "Night stop",
          address: "Khao San Rd, Talat Yot, Phra Nakhon, Bangkok 10200",
          lat: 13.759,
          lng: 100.4978,
          rating: 4.2,
          reviewCount: 32100,
          imageUrl:
            "https://images.unsplash.com/photo-1559628233-100c798642d4?auto=format&fit=crop&w=800&q=80",
          time: "19:00",
          timeEnd: "22:00",
          notes: "Street food crawl — mango sticky rice, pad thai, and fresh coconut ice cream.",
        },
      ],
    },
    /* ── Day 2 (May 14) — Riverside & Modern Bangkok ── */
    {
      id: "200-day2",
      type: "itinerary",
      date: "2025-05-14",
      title: "Day 2 — Riverside & Modern Bangkok",
      places: [
        {
          id: "200-lhong-1919",
          name: "Lhong 1919",
          description: "Heritage port",
          address: "248 Chiang Mai Rd, Khlong San, Bangkok 10600",
          lat: 13.7289,
          lng: 100.5052,
          rating: 4.5,
          reviewCount: 22800,
          imageUrl:
            "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80",
          time: "09:30",
          timeEnd: "11:00",
          notes: "Beautiful 19th-century Chinese port atmosphere. Arrive early before tour groups.",
        },
        {
          id: "200-iconsiam",
          name: "ICONSIAM",
          description: "Riverside mall",
          address: "299 Charoen Nakhon Rd, Khlong San, Bangkok 10600",
          lat: 13.7262,
          lng: 100.5104,
          rating: 4.6,
          reviewCount: 58300,
          imageUrl:
            "https://images.unsplash.com/photo-1534531173927-aeb928d54385?auto=format&fit=crop&w=800&q=80",
          time: "11:15",
          timeEnd: "14:00",
          cost: 1800,
        },
        {
          id: "200-ev-iconsiam-d2",
          name: "PEA Volta @ ICONSIAM",
          description: "EV Charging",
          address: "299 Charoen Nakhon Rd, Khlong San, Bangkok 10600",
          lat: 13.7255,
          lng: 100.5099,
          rating: 4.2,
          reviewCount: 640,
          isEvCharger: true,
          evConnectors: "CCS2, CHAdeMO, Type 2",
          evPowerKw: 22,
          time: "14:00",
          timeEnd: "15:15",
          notes: "Charge while having lunch at SookSiam inside ICONSIAM. Great combo stop.",
        },
        {
          id: "200-jam-factory",
          name: "The Jam Factory",
          description: "Creative hub",
          address: "41/1-5 Charoen Nakhon Rd, Khlong San, Bangkok 10600",
          lat: 13.7264,
          lng: 100.5141,
          rating: 4.4,
          reviewCount: 12800,
          imageUrl:
            "https://images.unsplash.com/photo-1545158535-c3f7168c28b6?auto=format&fit=crop&w=800&q=80",
          time: "15:30",
          timeEnd: "17:00",
        },
        {
          id: "200-asiatique",
          name: "Asiatique The Riverfront",
          description: "Riverfront",
          address: "2194 Charoen Krung Rd, Wat Phraya Krai, Bang Kho Laem, Bangkok 10120",
          lat: 13.7148,
          lng: 100.5079,
          rating: 4.4,
          reviewCount: 39200,
          imageUrl:
            "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=800&q=80",
          time: "17:30",
          timeEnd: "20:00",
          cost: 400,
        },
        {
          id: "200-ev-paragon-d2",
          name: "Tesla Supercharger @ Siam Paragon",
          description: "EV Charging",
          address: "991 Rama I Rd, Pathum Wan, Bangkok 10330",
          lat: 13.7463,
          lng: 100.5345,
          rating: 4.5,
          reviewCount: 890,
          isEvCharger: true,
          evConnectors: "CCS2 (Tesla Magic Dock)",
          evPowerKw: 250,
          time: "20:30",
          timeEnd: "21:05",
          notes: "Fastest charger in Bangkok. 0–80% in ~25 minutes on Model 3 LR.",
        },
      ],
    },
    /* ── Day 3 (May 15) — Art, Markets & Chatuchak ── */
    {
      id: "200-day3",
      type: "itinerary",
      date: "2025-05-15",
      title: "Day 3 — Art, Chatuchak & Or Tor Kor",
      places: [
        {
          id: "200-bacc",
          name: "Bangkok Art and Culture Centre (BACC)",
          description: "Art gallery",
          address: "939 Rama I Rd, Wang Mai, Pathum Wan, Bangkok 10330",
          lat: 13.747,
          lng: 100.5303,
          rating: 4.3,
          reviewCount: 14200,
          imageUrl:
            "https://images.unsplash.com/photo-1545158535-c3f7168c28b6?auto=format&fit=crop&w=800&q=80",
          time: "09:00",
          timeEnd: "10:30",
        },
        {
          id: "200-chatuchak",
          name: "Chatuchak Weekend Market",
          description: "Weekend market",
          address: "587/10 Chatuchak, Bangkok 10900",
          lat: 13.7997,
          lng: 100.5502,
          rating: 4.4,
          reviewCount: 52600,
          imageUrl:
            "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80",
          time: "10:45",
          timeEnd: "13:00",
          cost: 1200,
          notes: "Sections 2–4 for vintage clothes, section 7 for antiques. Bring cash — most vendors don't take cards.",
        },
        {
          id: "200-or-tor-kor",
          name: "Or Tor Kor Market",
          description: "Gourmet market",
          address: "101 Kamphaeng Phet Rd, Chatuchak, Bangkok 10900",
          lat: 13.799,
          lng: 100.5451,
          rating: 4.5,
          reviewCount: 19400,
          imageUrl:
            "https://images.unsplash.com/photo-1578674473215-9e07ee2e577d?auto=format&fit=crop&w=800&q=80",
          time: "13:15",
          timeEnd: "14:15",
          notes: "Best tropical fruit in Bangkok — durian, mangosteen, rambutan. Also great cooked food stalls.",
        },
        {
          id: "200-ev-jodd-d3",
          name: "EA Anywhere @ JODD FAIRS Rama 9",
          description: "EV Charging",
          address: "55 Kamphaeng Phet 6 Rd, Chatuchak, Bangkok 10900",
          lat: 13.7595,
          lng: 100.5669,
          rating: 4.2,
          reviewCount: 540,
          isEvCharger: true,
          evConnectors: "CCS2, Type 2",
          evPowerKw: 30,
          time: "15:00",
          timeEnd: "15:45",
          notes: "Charge while walking the night market. Opens at 5 PM but chargers available all day.",
        },
        {
          id: "200-terminal21",
          name: "Terminal 21 Asok",
          description: "Shopping mall",
          address: "88 Sukhumvit Soi 19, Khlong Toei, Bangkok 10110",
          lat: 13.7369,
          lng: 100.5606,
          rating: 4.5,
          reviewCount: 48700,
          imageUrl:
            "https://images.unsplash.com/photo-1555529771-835f59fc5efe?auto=format&fit=crop&w=800&q=80",
          time: "16:30",
          timeEnd: "18:30",
          cost: 800,
        },
        {
          id: "200-ev-emquartier-d3",
          name: "OnePlug @ EmQuartier",
          description: "EV Charging",
          address: "689 Sukhumvit Rd, Khlong Toei Nuea, Watthana, Bangkok 10110",
          lat: 13.7308,
          lng: 100.5695,
          rating: 4.4,
          reviewCount: 720,
          isEvCharger: true,
          evConnectors: "CCS2, CHAdeMO",
          evPowerKw: 50,
          time: "18:45",
          timeEnd: "19:30",
        },
      ],
    },
    /* ── Day 4 (May 16) — Sukhumvit, Siam & Benchasiri ── */
    {
      id: "200-day4",
      type: "itinerary",
      date: "2025-05-16",
      title: "Day 4 — Siam, Sukhumvit & Park Day",
      places: [
        {
          id: "200-siam-center",
          name: "Siam Center",
          description: "Fashion mall",
          address: "989 Rama I Rd, Pathum Wan, Bangkok 10330",
          lat: 13.7455,
          lng: 100.5322,
          rating: 4.4,
          reviewCount: 31200,
          imageUrl:
            "https://images.unsplash.com/photo-1555529771-835f59fc5efe?auto=format&fit=crop&w=800&q=80",
          time: "10:00",
          timeEnd: "11:30",
          cost: 1200,
        },
        {
          id: "200-mbk",
          name: "MBK Center",
          description: "Shopping mall",
          address: "444 Phayathai Rd, Wang Mai, Pathum Wan, Bangkok 10330",
          lat: 13.7452,
          lng: 100.5299,
          rating: 4.3,
          reviewCount: 42100,
          imageUrl:
            "https://images.unsplash.com/photo-1534531173927-aeb928d54385?auto=format&fit=crop&w=800&q=80",
          time: "11:45",
          timeEnd: "13:30",
        },
        {
          id: "200-benchasiri",
          name: "Benchasiri Park",
          description: "City park",
          address: "Sukhumvit Rd, Khlong Toei, Bangkok 10110",
          lat: 13.7294,
          lng: 100.5594,
          rating: 4.5,
          reviewCount: 14800,
          imageUrl:
            "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=800&q=80",
          time: "14:00",
          timeEnd: "15:30",
          notes: "Peaceful afternoon break. Sculptures from around the world, lakeside paths perfect for a walk.",
        },
        {
          id: "200-emquartier",
          name: "EmQuartier",
          description: "Luxury mall",
          address: "693, 695 Sukhumvit Rd, Khlong Toei Nuea, Watthana, Bangkok 10110",
          lat: 13.7302,
          lng: 100.5687,
          rating: 4.5,
          reviewCount: 39600,
          imageUrl:
            "https://images.unsplash.com/photo-1560472355-536de3962603?auto=format&fit=crop&w=800&q=80",
          time: "15:45",
          timeEnd: "18:00",
          cost: 1800,
        },
        {
          id: "200-ev-emquartier-d4",
          name: "OnePlug @ EmQuartier (B3 Parking)",
          description: "EV Charging",
          address: "689 Sukhumvit Rd, Khlong Toei Nuea, Watthana, Bangkok 10110",
          lat: 13.7308,
          lng: 100.5697,
          rating: 4.4,
          reviewCount: 720,
          isEvCharger: true,
          evConnectors: "CCS2, CHAdeMO",
          evPowerKw: 50,
          time: "18:00",
          timeEnd: "18:45",
          notes: "Same stop as Day 3 — chargers on B3. Top up before heading to Thonglor.",
        },
        {
          id: "200-j-avenue",
          name: "J Avenue Thonglor",
          description: "Night dining",
          address: "323/1 Sukhumvit 55, Khlong Tan Nuea, Watthana, Bangkok 10110",
          lat: 13.7267,
          lng: 100.5826,
          rating: 4.3,
          reviewCount: 9800,
          imageUrl:
            "https://images.unsplash.com/photo-1559628233-100c798642d4?auto=format&fit=crop&w=800&q=80",
          time: "19:30",
          timeEnd: "22:00",
        },
      ],
    },
    /* ── Day 5 (May 17) — Ayutthaya Day Trip ── */
    {
      id: "200-day5",
      type: "itinerary",
      date: "2025-05-17",
      title: "Day 5 — Ayutthaya Day Trip",
      places: [
        {
          id: "200-wat-mahathat",
          name: "Wat Mahathat",
          description: "Ancient temple",
          address: "Naresuan Rd, Tha Wasukri, Phra Nakhon Si Ayutthaya 13000",
          lat: 14.3556,
          lng: 100.5607,
          rating: 4.6,
          reviewCount: 38400,
          imageUrl:
            "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=800&q=80",
          time: "09:00",
          timeEnd: "10:30",
          cost: 50,
          isVisited: true,
          notes: "The famous Buddha head entwined in tree roots. Do not put your head near it for photos — it's disrespectful.",
        },
        {
          id: "200-wat-ratchaburana",
          name: "Wat Ratchaburana",
          description: "Ruins",
          address: "Naresuan Rd, Tha Wasukri, Phra Nakhon Si Ayutthaya 13000",
          lat: 14.3563,
          lng: 100.5614,
          rating: 4.5,
          reviewCount: 18200,
          imageUrl:
            "https://images.unsplash.com/photo-1563491945-14abb8ac5965?auto=format&fit=crop&w=800&q=80",
          time: "10:45",
          timeEnd: "12:00",
          cost: 50,
          isVisited: true,
        },
        {
          id: "200-wat-phra-si-sanphet",
          name: "Wat Phra Si Sanphet",
          description: "Royal temple",
          address: "Si Sanphet Rd, Tha Wasukri, Phra Nakhon Si Ayutthaya 13000",
          lat: 14.3548,
          lng: 100.5591,
          rating: 4.6,
          reviewCount: 22500,
          imageUrl:
            "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=800&q=80",
          time: "12:15",
          timeEnd: "13:30",
          cost: 50,
        },
        {
          id: "200-baan-kun-pra",
          name: "Baan Kun Pra",
          description: "Riverside cafe",
          address: "48 Moo 3, U Thong Rd, Phra Nakhon Si Ayutthaya 13000",
          lat: 14.3489,
          lng: 100.5662,
          rating: 4.4,
          reviewCount: 6700,
          imageUrl:
            "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80",
          time: "13:45",
          timeEnd: "14:45",
          notes: "Beautiful colonial-style riverside café. Try the iced lychee tea and mango sticky rice.",
        },
        {
          id: "200-ev-ayutthaya",
          name: "EA Anywhere @ PTT Station Ayutthaya",
          description: "EV Charging",
          address: "Rojana Rd, Phra Nakhon Si Ayutthaya 13000",
          lat: 14.3529,
          lng: 100.5588,
          rating: 4.1,
          reviewCount: 280,
          isEvCharger: true,
          evConnectors: "CCS2, CHAdeMO, Type 2",
          evPowerKw: 50,
          time: "15:00",
          timeEnd: "15:50",
          notes: "Only EA charger in central Ayutthaya. Charge to 80% before heading back — 80 km to Bangkok.",
        },
        {
          id: "200-ev-future-park",
          name: "Tesla Supercharger @ Future Park Rangsit",
          description: "EV Charging",
          address: "94 Phahonyothin Rd, Prachathipat, Thanyaburi, Pathum Thani 12130",
          lat: 13.9998,
          lng: 100.6267,
          rating: 4.6,
          reviewCount: 1120,
          isEvCharger: true,
          evConnectors: "CCS2 (Tesla Magic Dock)",
          evPowerKw: 250,
          time: "17:30",
          timeEnd: "17:55",
          notes: "Quick 25-min top-up on the way back to Bangkok. 12 stalls, rarely full on weekday evenings.",
        },
      ],
    },
    /* ── My List 1 — Bangkok Restaurants ── */
    {
      id: "200-list-restaurants",
      type: "list",
      title: "Bangkok Restaurants",
      places: [
        {
          id: "200-jay-fai",
          name: "Jay Fai",
          description: "Thai street food",
          address: "327 Maha Chai Rd, Samran Rat, Phra Nakhon, Bangkok 10200",
          lat: 13.7532,
          lng: 100.5012,
          rating: 4.7,
          reviewCount: 8900,
          imageUrl:
            "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
          notes: "Michelin-starred street food. Book 2 weeks in advance. Crab omelette is unmissable.",
        },
        {
          id: "200-nahm",
          name: "Nahm Restaurant",
          description: "Fine dining Thai",
          address: "27 S Sathon Rd, Tungmahamek, Sathon, Bangkok 10120",
          lat: 13.7254,
          lng: 100.5387,
          rating: 4.6,
          reviewCount: 5400,
          imageUrl:
            "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80",
          notes: "World-class Thai fine dining. Set menu only — allow 2.5 hours.",
        },
        {
          id: "200-or-tor-kor-list",
          name: "Or Tor Kor Market",
          description: "Gourmet market",
          address: "101 Kamphaeng Phet Rd, Chatuchak, Bangkok 10900",
          lat: 13.799,
          lng: 100.5451,
          rating: 4.5,
          reviewCount: 19400,
          imageUrl:
            "https://images.unsplash.com/photo-1578674473215-9e07ee2e577d?auto=format&fit=crop&w=800&q=80",
        },
        {
          id: "200-pier21",
          name: "Pier 21 Food Court at Terminal 21",
          description: "Local food court",
          address: "88 Sukhumvit Soi 19, Asok, Bangkok 10110",
          lat: 13.7361,
          lng: 100.5601,
          rating: 4.3,
          reviewCount: 11800,
          imageUrl:
            "https://images.unsplash.com/photo-1559628233-100c798642d4?auto=format&fit=crop&w=800&q=80",
          notes: "Best cheap eats in Bangkok. No tourist markup — real prices for locals.",
        },
        {
          id: "200-sooksiam",
          name: "SookSiam at ICONSIAM",
          description: "Thai market food",
          address: "299 Charoen Nakhon Rd, Khlong San, Bangkok 10600",
          lat: 13.7258,
          lng: 100.5112,
          rating: 4.5,
          reviewCount: 16300,
          imageUrl:
            "https://images.unsplash.com/photo-1578674473215-9e07ee2e577d?auto=format&fit=crop&w=800&q=80",
          notes: "Indoor Thai floating market inside ICONSIAM. Regional dishes from all 77 provinces.",
        },
      ],
    },
    /* ── My List 2 — Cafe Picks ── */
    {
      id: "200-list-cafes",
      type: "list",
      title: "Cafe Picks",
      places: [
        {
          id: "200-rocket-coffee",
          name: "Rocket Coffeebar S12",
          description: "Specialty coffee",
          address: "149 Suan Phlu, Thung Maha Mek, Sathon, Bangkok 10120",
          lat: 13.7246,
          lng: 100.5388,
          rating: 4.5,
          reviewCount: 5600,
          imageUrl:
            "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80",
          notes: "Best flat white in Bangkok. Industrial-chic space with great natural light.",
        },
        {
          id: "200-roots-coffee",
          name: "Roots Coffee Roaster",
          description: "Specialty coffee",
          address: "Gaysorn Urban Resort, 999 Phloen Chit Rd, Lumpini, Bangkok",
          lat: 13.731,
          lng: 100.5469,
          rating: 4.6,
          reviewCount: 4200,
          imageUrl:
            "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80",
          notes: "Thai single-origin beans done brilliantly. Try the cold brew with coconut milk.",
        },
        {
          id: "200-brave-roasters",
          name: "Brave Roasters Coffee",
          description: "Cafe",
          address: "49/6 Ekkamai Soi 2, Watthana, Bangkok 10110",
          lat: 13.7209,
          lng: 100.5851,
          rating: 4.4,
          reviewCount: 3100,
          imageUrl:
            "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80",
        },
        {
          id: "200-arabica-ari",
          name: "% Arabica Ari",
          description: "Specialty coffee",
          address: "51 Phahonyothin 7 Alley, Samsennai, Phaya Thai, Bangkok 10400",
          lat: 13.7818,
          lng: 100.5437,
          rating: 4.4,
          reviewCount: 7800,
          imageUrl:
            "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80",
          notes: "Japanese minimalist coffee chain with some of the most Instagrammable lattes in BKK.",
        },
        {
          id: "200-ceresia",
          name: "Ceresia Coffee Roasters",
          description: "Specialty coffee",
          address: "Witthayu Rd, Lumpini, Pathum Wan, Bangkok 10330",
          lat: 13.7533,
          lng: 100.5262,
          rating: 4.5,
          reviewCount: 3800,
          imageUrl:
            "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80",
          notes: "Hidden gem near Lumpini. Exceptional pour-over menu and knowledgeable baristas.",
        },
      ],
    },
    /* ── My List 3 — Temple Trail ── */
    {
      id: "200-list-temples",
      type: "list",
      title: "Temple Trail",
      places: [
        {
          id: "200-wat-saket",
          name: "Wat Saket (Golden Mount)",
          description: "Temple & viewpoint",
          address: "344 Thanon Chakkraphatdi Phong, Pom Prap, Bangkok 10100",
          lat: 13.7531,
          lng: 100.5065,
          rating: 4.5,
          reviewCount: 24600,
          imageUrl:
            "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=800&q=80",
          notes: "Climb 318 steps for a 360° panoramic view over Bangkok's old city. Best at sunset.",
        },
        {
          id: "200-wat-suthat",
          name: "Wat Suthat Thepwararam",
          description: "Temple",
          address: "146 Bamrung Mueang Rd, Pom Prap, Bangkok 10100",
          lat: 13.7488,
          lng: 100.5019,
          rating: 4.5,
          reviewCount: 16400,
          imageUrl:
            "https://images.unsplash.com/photo-1563491945-14abb8ac5965?auto=format&fit=crop&w=800&q=80",
        },
        {
          id: "200-wat-benchamabophit",
          name: "Wat Benchamabophit (Marble Temple)",
          description: "Marble temple",
          address: "69 Rama V Rd, Dusit, Bangkok 10300",
          lat: 13.7659,
          lng: 100.5137,
          rating: 4.6,
          reviewCount: 21800,
          imageUrl:
            "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=800&q=80",
          notes: "Arguably the most beautiful temple in Bangkok. Completely clad in Italian Carrara marble.",
        },
        {
          id: "200-wat-ratchanadda",
          name: "Wat Ratchanadda (Loha Prasat)",
          description: "Metal castle",
          address: "2 Maha Chai Rd, Samran Rat, Phra Nakhon, Bangkok 10200",
          lat: 13.7544,
          lng: 100.5026,
          rating: 4.4,
          reviewCount: 12100,
          imageUrl:
            "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=800&q=80",
        },
        {
          id: "200-wat-bowon",
          name: "Wat Bowon Niwet Vihara",
          description: "Royal temple",
          address: "248 Phra Sumen Rd, Talat Yot, Phra Nakhon, Bangkok 10200",
          lat: 13.7617,
          lng: 100.501,
          rating: 4.3,
          reviewCount: 8900,
          imageUrl:
            "https://images.unsplash.com/photo-1563491945-14abb8ac5965?auto=format&fit=crop&w=800&q=80",
          notes: "Royal temple open to visitors. Less crowded than Grand Palace area — a real hidden gem.",
        },
      ],
    },
  ],
  "110": [
    {
      id: "khao-yai-run",
      title: "Forest road and waterfall stops",
      places: [
        {
          id: "khao-yai-national-park",
          name: "Khao Yai National Park",
          description: "Forest road",
          address: "Nakhon Ratchasima",
          lat: 14.4391,
          lng: 101.3725,
          rating: 4.6,
          reviewCount: 20100,
        },
        {
          id: "haew-suwat-waterfall",
          name: "Haew Suwat Waterfall",
          description: "Waterfall",
          address: "Khao Yai National Park",
          lat: 14.4358,
          lng: 101.4183,
          rating: 4.4,
          reviewCount: 7600,
        },
        {
          id: "pb-valley",
          name: "PB Valley Khao Yai Winery",
          description: "Vineyard",
          address: "Pak Chong, Nakhon Ratchasima",
          lat: 14.5701,
          lng: 101.3063,
          rating: 4.3,
          reviewCount: 5200,
        },
      ],
    },
  ],
};

export function getUserById(id: string): UserProfile | undefined {
  return USERS.find((user) => user.id === id);
}

export function getPlanById(id: string): Plan | undefined {
  return PLANS.find((plan) => plan.id === id);
}

export function toPlanSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function getPlanHref(plan: Plan): string {
  return `/explore/view/${plan.id}/${toPlanSlug(plan.title)}`;
}

export function getPlanCopyHref(plan: Plan): string {
  const center = getPlanCenter(plan.id);

  const params: Record<string, string> = {
    destinationName: plan.province,
    templatePlanId: plan.id,
    lat: center.lat.toString(),
    lng: center.lng.toString(),
  };

  if (plan.templateStartDate && plan.templateEndDate) {
    const start = new Date(plan.templateStartDate);
    const end = new Date(plan.templateEndDate);
    const durationDays = Math.round(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newStart = today.toISOString().split("T")[0];
    const newEnd = new Date(today.getTime() + durationDays * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    params.from = newStart;
    params.to = newEnd;
    params.durationDays = durationDays.toString();
  }

  return `/planner/copied-${plan.id}?${new URLSearchParams(params).toString()}`;
}

export function getPlanDiscussionHref(plan: Plan): string {
  return `/community/create?${new URLSearchParams({
    planId: plan.id,
  }).toString()}`;
}

export function getPlanTemplateBlocks(planId: string): PlanTemplateBlock[] {
  const plan = getPlanById(planId);

  if (!plan) {
    return [];
  }

  return PLAN_TEMPLATE_BLOCKS[planId] ?? createFallbackTemplateBlocks(plan);
}

export function getPlanCenter(planId: string): { lat: number; lng: number } {
  const blocks = getPlanTemplateBlocks(planId);
  const places = blocks.flatMap((block) => block.places);

  if (places.length > 0) {
    return {
      lat:
        places.reduce((total, place) => total + place.lat, 0) / places.length,
      lng:
        places.reduce((total, place) => total + place.lng, 0) / places.length,
    };
  }

  const plan = getPlanById(planId);

  return plan
    ? (PROVINCE_CENTERS[plan.province] ?? { lat: 15.87, lng: 100.9925 })
    : { lat: 15.87, lng: 100.9925 };
}

export function formatCount(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toString();
}

function createFallbackTemplateBlocks(plan: Plan): PlanTemplateBlock[] {
  const center = PROVINCE_CENTERS[plan.province] ?? {
    lat: 15.87,
    lng: 100.9925,
  };

  return [
    {
      id: `${plan.id}-saved-list`,
      title: `${plan.province} saved places`,
      places: [
        {
          id: `${plan.id}-anchor`,
          name: plan.location,
          description: "Trip anchor",
          address: plan.location,
          lat: center.lat,
          lng: center.lng,
          rating: plan.rating,
          reviewCount: plan.reviews,
          imageUrl: plan.imageUrl,
        },
        {
          id: `${plan.id}-local-stop`,
          name: `${plan.province} local stop`,
          description: "Community pick",
          address: `${plan.province}, Thailand`,
          lat: center.lat + 0.025,
          lng: center.lng + 0.025,
          rating: Math.max(4.1, plan.rating - 0.2),
          reviewCount: Math.max(120, Math.round(plan.reviews * 0.35)),
        },
        {
          id: `${plan.id}-viewpoint`,
          name: `${plan.province} viewpoint`,
          description: "Photo stop",
          address: `${plan.province}, Thailand`,
          lat: center.lat - 0.02,
          lng: center.lng - 0.018,
          rating: Math.max(4.0, plan.rating - 0.1),
          reviewCount: Math.max(100, Math.round(plan.reviews * 0.28)),
        },
      ],
    },
  ];
}

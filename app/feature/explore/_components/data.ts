export type UserProfile = {
  id: string;
  name: string;
  avatarUrl: string;
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
];

export const TRENDING_PLANS = PLANS.filter((plan) => plan.isTrending);
export const RECENT_PLANS = PLANS.filter((plan) => !plan.isTrending);

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

export function formatCount(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toString();
}

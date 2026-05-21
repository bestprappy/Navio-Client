export type CommunityFeedSort = "best" | "new" | "top";
export type CommunityCommentSort = "best" | "new";

export type CommunityUser = {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  location: string;
};

export type SharedTripStop = {
  id: string;
  name: string;
  location: string;
  day: number;
};

export type SharedTrip = {
  id: string;
  title: string;
  location: string;
  country: string;
  durationDays: number;
  summary: string;
  coverImageUrl: string;
  authorId: string;
  stops: SharedTripStop[];
  tags: string[];
  copiedCount: number;
};

export type CommunityGroup = {
  id: string;
  name: string;
  description: string;
  avatarUrl: string;
  country: string;
  places: string[];
  tags: string[];
  rules: CommunityRule[];
  postFlairs: CommunityFlair[];
  userFlairs: CommunityFlair[];
  bookmarks: CommunityBookmark[];
  memberCount: number;
  postCount: number;
  createdById: string;
  isOfficial?: boolean;
};

export type CommunityRule = {
  id: string;
  title: string;
  description: string;
};

export type CommunityFlair = {
  id: string;
  label: string;
  tone: "reliable" | "question" | "unsourced" | "speculation" | "itinerary" | "food" | "ev";
};

export type CommunityBookmark = {
  id: string;
  label: string;
};

export type CommunityDiscoveryCategory = {
  id: string;
  label: string;
  keywords: string[];
};

export type CommunityGroupProfile = {
  groupId: string;
  bannerUrl: string;
  summary: string;
  weeklyVisitorCount: number;
  weeklyContributionCount: number;
  moderatorIds: string[];
};

export type CommunityPost = {
  id: string;
  groupId: string;
  authorId: string;
  title: string;
  body: string;
  createdAt: string;
  upvotes: number;
  commentCount: number;
  tags: string[];
  place: string;
  country: string;
  sharedTripId?: string;
  flairId?: string;
  imageUrl?: string;
};

export type CommunityComment = {
  id: string;
  postId: string;
  parentCommentId?: string;
  authorId: string;
  body: string;
  createdAt: string;
  upvotes: number;
  sharedTripId?: string;
};

export type CreateGroupDraft = {
  name: string;
  description: string;
  country: string;
  tags: string;
};

export type CreatePostDraft = {
  title: string;
  body: string;
  groupId: string;
  place: string;
  country: string;
  tags: string;
  attachTrip: boolean;
  sharedTripId: string | null;
};

export const currentCommunityUser: CommunityUser = {
  id: "user-current",
  name: "You",
  handle: "navio-traveler",
  avatarUrl: "",
  location: "Bangkok, Thailand",
};

export const communityDiscoveryCategories: CommunityDiscoveryCategory[] = [
  { id: "all", label: "All", keywords: [] },
  {
    id: "food-routes",
    label: "Food Routes",
    keywords: ["restaurant", "food", "ramen", "night market"],
  },
  {
    id: "thailand",
    label: "Thailand",
    keywords: ["thailand", "bangkok", "chiang mai", "phuket", "khao yai"],
  },
  {
    id: "city-breaks",
    label: "City Breaks",
    keywords: ["bangkok", "tokyo", "seoul", "osaka", "singapore"],
  },
  {
    id: "coastal",
    label: "Coastal",
    keywords: ["beach", "coastal", "seafood", "phuket", "bali", "vietnam"],
  },
  {
    id: "road-trips",
    label: "Road Trips",
    keywords: ["road trip", "ev", "charging", "route"],
  },
  {
    id: "japan",
    label: "Japan",
    keywords: ["japan", "tokyo", "osaka", "ramen"],
  },
  {
    id: "cafes",
    label: "Cafes",
    keywords: ["cafe", "coffee", "chiang mai", "seoul"],
  },
  {
    id: "official",
    label: "Official",
    keywords: ["official"],
  },
];

export const communityUsers: CommunityUser[] = [
  currentCommunityUser,
  {
    id: "user-kanya",
    name: "Kanya S.",
    handle: "kanya-eats",
    avatarUrl:
      "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=facearea&w=96&h=96",
    location: "Bangkok, Thailand",
  },
  {
    id: "user-narin",
    name: "Narin P.",
    handle: "slowroads",
    avatarUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=facearea&w=96&h=96",
    location: "Chiang Mai, Thailand",
  },
  {
    id: "user-pim",
    name: "Pim R.",
    handle: "islandplanner",
    avatarUrl:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=facearea&w=96&h=96",
    location: "Phuket, Thailand",
  },
  {
    id: "user-arthit",
    name: "Arthit K.",
    handle: "chargehunter",
    avatarUrl:
      "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=facearea&w=96&h=96",
    location: "Khao Yai, Thailand",
  },
  {
    id: "user-mika",
    name: "Mika T.",
    handle: "ramenroutes",
    avatarUrl:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=facearea&w=96&h=96",
    location: "Tokyo, Japan",
  },
];

const DEFAULT_COMMUNITY_GROUP_BANNER =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80";

export const mockSharedTrips: SharedTrip[] = [
  {
    id: "trip-bangkok-food-loop",
    title: "Bangkok Restaurant Loop: Chinatown, old town, and riverside",
    location: "Bangkok",
    country: "Thailand",
    durationDays: 2,
    summary:
      "A food-first city trip with Thai-Chinese restaurants, river breaks, and late-night dessert stops.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=900&q=80",
    authorId: "user-kanya",
    stops: [
      {
        id: "stop-yaowarat",
        name: "Yaowarat Road",
        location: "Bangkok",
        day: 1,
      },
      {
        id: "stop-old-town",
        name: "Old Town lunch crawl",
        location: "Bangkok",
        day: 1,
      },
      {
        id: "stop-riverside",
        name: "Riverside dinner",
        location: "Bangkok",
        day: 2,
      },
    ],
    tags: ["restaurant", "food", "bangkok", "thailand"],
    copiedCount: 128,
  },
  {
    id: "trip-chiang-mai-khao-soi",
    title: "Chiang Mai Khao Soi Weekend",
    location: "Chiang Mai",
    country: "Thailand",
    durationDays: 3,
    summary:
      "Khao soi, coffee, markets, and quiet mountain drives with an easy pace between meals.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    authorId: "user-narin",
    stops: [
      {
        id: "stop-nimman",
        name: "Nimman cafe morning",
        location: "Chiang Mai",
        day: 1,
      },
      {
        id: "stop-khao-soi",
        name: "Khao soi restaurant run",
        location: "Chiang Mai",
        day: 2,
      },
      {
        id: "stop-doi-suthep",
        name: "Doi Suthep sunset",
        location: "Chiang Mai",
        day: 3,
      },
    ],
    tags: ["restaurant", "cafe", "chiang mai", "thailand"],
    copiedCount: 96,
  },
  {
    id: "trip-phuket-seafood",
    title: "Phuket Seafood and Sunset Drive",
    location: "Phuket",
    country: "Thailand",
    durationDays: 2,
    summary:
      "Seafood restaurants, beach viewpoints, and flexible late starts along Phuket's west coast.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=900&q=80",
    authorId: "user-pim",
    stops: [
      {
        id: "stop-rawai",
        name: "Rawai seafood market",
        location: "Phuket",
        day: 1,
      },
      {
        id: "stop-kata",
        name: "Kata beach sunset",
        location: "Phuket",
        day: 1,
      },
      {
        id: "stop-old-phuket",
        name: "Old Phuket Town brunch",
        location: "Phuket",
        day: 2,
      },
    ],
    tags: ["restaurant", "seafood", "phuket", "thailand"],
    copiedCount: 74,
  },
  {
    id: "trip-khao-yai-charge",
    title: "Khao Yai EV Friendly Food and Charging Stops",
    location: "Khao Yai",
    country: "Thailand",
    durationDays: 2,
    summary:
      "A low-stress EV route that pairs lunch spots with reliable charging and scenic breaks.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=80",
    authorId: "user-arthit",
    stops: [
      {
        id: "stop-pak-chong",
        name: "Pak Chong charge stop",
        location: "Nakhon Ratchasima",
        day: 1,
      },
      {
        id: "stop-vineyard",
        name: "Vineyard lunch",
        location: "Khao Yai",
        day: 1,
      },
      {
        id: "stop-national-park",
        name: "National park viewpoint",
        location: "Khao Yai",
        day: 2,
      },
    ],
    tags: ["ev", "charging", "restaurant", "khao yai", "thailand"],
    copiedCount: 58,
  },
  {
    id: "trip-tokyo-ramen",
    title: "Tokyo Ramen Neighborhood Crawl",
    location: "Tokyo",
    country: "Japan",
    durationDays: 2,
    summary:
      "A restaurant-heavy Tokyo plan for ramen, side streets, and compact train-friendly neighborhoods.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=900&q=80",
    authorId: "user-mika",
    stops: [
      {
        id: "stop-shinjuku",
        name: "Shinjuku ramen",
        location: "Tokyo",
        day: 1,
      },
      {
        id: "stop-ueno",
        name: "Ueno izakaya lane",
        location: "Tokyo",
        day: 1,
      },
      {
        id: "stop-asakusa",
        name: "Asakusa lunch",
        location: "Tokyo",
        day: 2,
      },
    ],
    tags: ["restaurant", "ramen", "tokyo", "japan"],
    copiedCount: 44,
  },
];

export const mockCommunityGroupProfiles: CommunityGroupProfile[] = [
  {
    groupId: "group-thailand-restaurants",
    bannerUrl:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=80",
    summary:
      "A practical planning room for Thailand food routes, reservations, local timing, and restaurant-heavy itineraries.",
    weeklyVisitorCount: 62000,
    weeklyContributionCount: 1400,
    moderatorIds: ["user-kanya", "user-pim", "user-narin"],
  },
  {
    groupId: "group-bangkok-food",
    bannerUrl:
      "https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=1600&q=80",
    summary:
      "Bangkok-specific food route advice for neighborhoods, night markets, river hops, dessert stops, and traffic-aware pacing.",
    weeklyVisitorCount: 41800,
    weeklyContributionCount: 920,
    moderatorIds: ["user-kanya", "user-narin", "user-current"],
  },
  {
    groupId: "group-chiang-mai-cafes",
    bannerUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1600&q=80",
    summary:
      "Coffee, khao soi, mountain drives, and slower northern Thailand routes with realistic stop counts.",
    weeklyVisitorCount: 29300,
    weeklyContributionCount: 610,
    moderatorIds: ["user-narin", "user-arthit", "user-kanya"],
  },
  {
    groupId: "group-phuket-coast",
    bannerUrl:
      "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=1600&q=80",
    summary:
      "Coastal Phuket planning for seafood, sunset viewpoints, beach drives, island detours, and seasonal route checks.",
    weeklyVisitorCount: 24700,
    weeklyContributionCount: 470,
    moderatorIds: ["user-pim", "user-kanya", "user-mika"],
  },
  {
    groupId: "group-thailand-ev-charging",
    bannerUrl:
      "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=1600&q=80",
    summary:
      "EV road-trip planning across Thailand with charger reliability notes, backup stops, and food pairings.",
    weeklyVisitorCount: 35600,
    weeklyContributionCount: 780,
    moderatorIds: ["user-arthit", "user-narin", "user-current"],
  },
  {
    groupId: "group-tokyo-restaurant-routes",
    bannerUrl:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1600&q=80",
    summary:
      "Tokyo restaurant crawls, reservation timing, ramen neighborhoods, and compact transit-friendly itineraries.",
    weeklyVisitorCount: 18400,
    weeklyContributionCount: 350,
    moderatorIds: ["user-mika", "user-kanya", "user-pim"],
  },
  {
    groupId: "group-osaka-street-food",
    bannerUrl:
      "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=1600&q=80",
    summary:
      "Osaka food alleys, market timing, takoyaki crawls, and compact station-friendly eating routes.",
    weeklyVisitorCount: 16400,
    weeklyContributionCount: 290,
    moderatorIds: ["user-mika", "user-kanya"],
  },
  {
    groupId: "group-seoul-cafe-hops",
    bannerUrl:
      "https://images.unsplash.com/photo-1535189043414-47a3c49a0bed?auto=format&fit=crop&w=1600&q=80",
    summary:
      "Neighborhood cafe loops, dessert stops, transit timing, and low-stress Seoul planning notes.",
    weeklyVisitorCount: 14200,
    weeklyContributionCount: 240,
    moderatorIds: ["user-mika", "user-narin"],
  },
  {
    groupId: "group-vietnam-coastal-routes",
    bannerUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
    summary:
      "Coastal Vietnam route planning for seafood, viewpoints, scooters, trains, and weather windows.",
    weeklyVisitorCount: 19800,
    weeklyContributionCount: 360,
    moderatorIds: ["user-pim", "user-narin"],
  },
  {
    groupId: "group-bali-sunset-stops",
    bannerUrl:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1600&q=80",
    summary:
      "Bali sunset routes, beach clubs, scooter timing, and restaurant pairings without overpacking the day.",
    weeklyVisitorCount: 22100,
    weeklyContributionCount: 410,
    moderatorIds: ["user-pim", "user-kanya"],
  },
  {
    groupId: "group-singapore-food-courts",
    bannerUrl:
      "https://images.unsplash.com/photo-1565967511849-76a60a516170?auto=format&fit=crop&w=1600&q=80",
    summary:
      "Hawker-center planning, neighborhood food courts, weather-proof walking routes, and transit shortcuts.",
    weeklyVisitorCount: 17600,
    weeklyContributionCount: 310,
    moderatorIds: ["user-kanya", "user-mika"],
  },
  {
    groupId: "group-taiwan-night-markets",
    bannerUrl:
      "https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?auto=format&fit=crop&w=1600&q=80",
    summary:
      "Taiwan night market routes, snack pacing, train-friendly city loops, and rainy-evening backups.",
    weeklyVisitorCount: 15300,
    weeklyContributionCount: 270,
    moderatorIds: ["user-narin", "user-mika"],
  },
];

export const mockCommunityGroups: CommunityGroup[] = [
  {
    id: "group-thailand-restaurants",
    name: "Thailand Restaurants",
    avatarUrl:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=96&h=96",
    description:
      "Restaurant planning across Thailand, from street stalls to riverside reservations.",
    country: "Thailand",
    places: ["Bangkok", "Chiang Mai", "Phuket", "Khao Yai"],
    tags: ["restaurant", "food", "thailand", "local tips"],
    rules: [
      {
        id: "thai-restaurants-civil",
        title: "Be respectful and specific",
        description:
          "Share concrete restaurant, route, timing, or budget details so others can act on your advice.",
      },
      {
        id: "thai-restaurants-source",
        title: "Mark first-hand experience",
        description:
          "Say whether you visited, copied the trip, or are asking from research.",
      },
      {
        id: "thai-restaurants-spam",
        title: "No spam or undisclosed promotion",
        description:
          "Restaurant owners and partners should disclose their relationship clearly.",
      },
    ],
    postFlairs: [
      { id: "flair-reliable", label: "Reliable", tone: "reliable" },
      { id: "flair-question", label: "Question", tone: "question" },
      { id: "flair-unsourced", label: "Unsourced", tone: "unsourced" },
      { id: "flair-food", label: "Food Route", tone: "food" },
    ],
    userFlairs: [
      { id: "user-flair-local", label: "Local Guide", tone: "reliable" },
      { id: "user-flair-foodie", label: "Food Planner", tone: "food" },
    ],
    bookmarks: [
      { id: "bookmark-restaurant-map", label: "Restaurant map" },
      { id: "bookmark-reservation-tips", label: "Reservation tips" },
      { id: "bookmark-food-budget", label: "Food budget guide" },
    ],
    memberCount: 24800,
    postCount: 381,
    createdById: "user-kanya",
    isOfficial: true,
  },
  {
    id: "group-bangkok-food",
    name: "Bangkok Food Routes",
    avatarUrl:
      "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=96&h=96",
    description:
      "Route-friendly food discussions for Bangkok restaurants, night markets, and dessert stops.",
    country: "Thailand",
    places: ["Bangkok", "Yaowarat", "Ari", "Thonburi"],
    tags: ["bangkok", "restaurant", "night market", "food"],
    rules: [
      {
        id: "bangkok-food-neighborhood",
        title: "Mention the neighborhood",
        description:
          "Bangkok timing changes by area, so include the district or closest transit stop.",
      },
      {
        id: "bangkok-food-traffic",
        title: "Include traffic assumptions",
        description:
          "Call out rush-hour, ferry, taxi, or walking assumptions when suggesting routes.",
      },
      {
        id: "bangkok-food-no-doxx",
        title: "Keep private contacts private",
        description:
          "Do not share personal phone numbers or private booking contacts without consent.",
      },
    ],
    postFlairs: [
      { id: "flair-food-route", label: "Food Route", tone: "food" },
      { id: "flair-question-bkk", label: "Question", tone: "question" },
      { id: "flair-reliable-bkk", label: "Reliable", tone: "reliable" },
      { id: "flair-speculation-bkk", label: "Speculation", tone: "speculation" },
    ],
    userFlairs: [
      { id: "user-flair-bkk-local", label: "Bangkok Local", tone: "reliable" },
      { id: "user-flair-night-market", label: "Night Market Pro", tone: "food" },
    ],
    bookmarks: [
      { id: "bookmark-yaowarat", label: "Yaowarat route notes" },
      { id: "bookmark-riverside", label: "Riverside timing" },
      { id: "bookmark-dessert", label: "Dessert stops" },
    ],
    memberCount: 13200,
    postCount: 214,
    createdById: "user-kanya",
  },
  {
    id: "group-chiang-mai-cafes",
    name: "Chiang Mai Cafes and Khao Soi",
    avatarUrl:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=96&h=96",
    description:
      "Coffee, khao soi, and mountain day routes around Chiang Mai.",
    country: "Thailand",
    places: ["Chiang Mai", "Nimman", "Mae Rim", "Doi Suthep"],
    tags: ["cafe", "restaurant", "chiang mai", "khao soi"],
    rules: [
      {
        id: "cm-cafe-source",
        title: "Source recent openings",
        description:
          "Cafe and restaurant hours change often; include when you last checked or visited.",
      },
      {
        id: "cm-cafe-pace",
        title: "Avoid overpacked routes",
        description:
          "Recommend realistic stop counts for mountain roads and slower meal timing.",
      },
      {
        id: "cm-cafe-kind",
        title: "Keep taste debates useful",
        description:
          "Compare preferences without dismissing other travelers' budgets or diets.",
      },
    ],
    postFlairs: [
      { id: "flair-khao-soi", label: "Khao Soi", tone: "food" },
      { id: "flair-cafe", label: "Cafe Route", tone: "itinerary" },
      { id: "flair-question-cm", label: "Question", tone: "question" },
      { id: "flair-unsourced-cm", label: "Unsourced", tone: "unsourced" },
    ],
    userFlairs: [
      { id: "user-flair-cafe-hopper", label: "Cafe Hopper", tone: "food" },
      { id: "user-flair-north-local", label: "Northern Local", tone: "reliable" },
    ],
    bookmarks: [
      { id: "bookmark-khao-soi", label: "Khao soi list" },
      { id: "bookmark-mountain", label: "Mountain drive timing" },
      { id: "bookmark-cafes", label: "Cafe work spots" },
    ],
    memberCount: 8900,
    postCount: 146,
    createdById: "user-narin",
  },
  {
    id: "group-phuket-coast",
    name: "Phuket Coast Trips",
    avatarUrl:
      "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=96&h=96",
    description:
      "Beach drives, seafood restaurants, viewpoint timing, and island detours.",
    country: "Thailand",
    places: ["Phuket", "Rawai", "Kata", "Patong"],
    tags: ["phuket", "restaurant", "beach", "seafood"],
    rules: [
      {
        id: "phuket-weather",
        title: "Add season and weather context",
        description:
          "Beach and seafood plans depend on rain, heat, and sunset timing.",
      },
      {
        id: "phuket-transport",
        title: "Explain transport assumptions",
        description:
          "State whether the trip assumes car, scooter, taxi, or walking between stops.",
      },
      {
        id: "phuket-safety",
        title: "No unsafe route advice",
        description:
          "Do not suggest risky driving, illegal parking, or closed-access viewpoints.",
      },
    ],
    postFlairs: [
      { id: "flair-seafood", label: "Seafood", tone: "food" },
      { id: "flair-beach-route", label: "Beach Route", tone: "itinerary" },
      { id: "flair-question-phuket", label: "Question", tone: "question" },
      { id: "flair-reliable-phuket", label: "Reliable", tone: "reliable" },
    ],
    userFlairs: [
      { id: "user-flair-island-local", label: "Island Local", tone: "reliable" },
      { id: "user-flair-seafood", label: "Seafood Scout", tone: "food" },
    ],
    bookmarks: [
      { id: "bookmark-rawai", label: "Rawai seafood notes" },
      { id: "bookmark-sunset", label: "Sunset viewpoints" },
      { id: "bookmark-parking", label: "Parking tips" },
    ],
    memberCount: 7600,
    postCount: 119,
    createdById: "user-pim",
  },
  {
    id: "group-thailand-ev-charging",
    name: "Thailand EV Charging Stops",
    avatarUrl:
      "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=96&h=96",
    description:
      "Charging reliability, restaurant pairings, and route recovery tips for EV travelers.",
    country: "Thailand",
    places: ["Khao Yai", "Hua Hin", "Rayong", "Bangkok"],
    tags: ["ev", "charging", "thailand", "road trip"],
    rules: [
      {
        id: "ev-verify",
        title: "Verify charger details",
        description:
          "Mention app, operator, plug type, queue, and when the charger was checked.",
      },
      {
        id: "ev-backup",
        title: "Include a backup stop",
        description:
          "Route advice should include what to do if the preferred charger is busy or offline.",
      },
      {
        id: "ev-range",
        title: "Share vehicle assumptions",
        description:
          "Battery size, starting charge, and driving style matter for EV trip advice.",
      },
    ],
    postFlairs: [
      { id: "flair-reliable-ev", label: "Reliable", tone: "reliable" },
      { id: "flair-ev-route", label: "EV Route", tone: "ev" },
      { id: "flair-question-ev", label: "Question", tone: "question" },
      { id: "flair-unsourced-ev", label: "Unsourced", tone: "unsourced" },
    ],
    userFlairs: [
      { id: "user-flair-ev-owner", label: "EV Owner", tone: "ev" },
      { id: "user-flair-charger", label: "Charger Scout", tone: "reliable" },
    ],
    bookmarks: [
      { id: "bookmark-operator-apps", label: "Operator apps" },
      { id: "bookmark-backup-stops", label: "Backup stop guide" },
      { id: "bookmark-range", label: "Range planning" },
    ],
    memberCount: 10400,
    postCount: 188,
    createdById: "user-arthit",
    isOfficial: true,
  },
  {
    id: "group-tokyo-restaurant-routes",
    name: "Tokyo Restaurant Routes",
    avatarUrl:
      "https://images.unsplash.com/photo-1557872943-16a5ac26437e?auto=format&fit=crop&w=96&h=96",
    description:
      "Neighborhood restaurant crawls, reservation timing, and compact trip plans around Tokyo.",
    country: "Japan",
    places: ["Tokyo", "Shinjuku", "Ueno", "Asakusa"],
    tags: ["restaurant", "tokyo", "ramen", "japan"],
    rules: [
      {
        id: "tokyo-neighborhood",
        title: "Group stops by neighborhood",
        description:
          "Tokyo restaurant plans are easier to copy when transit time is clear.",
      },
      {
        id: "tokyo-reservations",
        title: "Mark reservation requirements",
        description:
          "Tell travelers whether walk-ins are realistic or booking is required.",
      },
      {
        id: "tokyo-source",
        title: "Separate rumors from visits",
        description:
          "Use flairs when a restaurant note is unvisited or based on research.",
      },
    ],
    postFlairs: [
      { id: "flair-ramen", label: "Ramen", tone: "food" },
      { id: "flair-itinerary-tokyo", label: "Itinerary", tone: "itinerary" },
      { id: "flair-question-tokyo", label: "Question", tone: "question" },
      { id: "flair-reliable-tokyo", label: "Reliable", tone: "reliable" },
    ],
    userFlairs: [
      { id: "user-flair-tokyo-local", label: "Tokyo Local", tone: "reliable" },
      { id: "user-flair-ramen", label: "Ramen Scout", tone: "food" },
    ],
    bookmarks: [
      { id: "bookmark-shinjuku", label: "Shinjuku crawl" },
      { id: "bookmark-reservations", label: "Reservation guide" },
      { id: "bookmark-transit", label: "Transit shortcuts" },
    ],
    memberCount: 5200,
    postCount: 92,
    createdById: "user-mika",
  },
  {
    id: "group-osaka-street-food",
    name: "Osaka Street Food",
    avatarUrl:
      "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=96&h=96",
    description:
      "Takoyaki, okonomiyaki, markets, and station-friendly routes for eating through Osaka.",
    country: "Japan",
    places: ["Osaka", "Dotonbori", "Namba", "Shinsekai"],
    tags: ["osaka", "japan", "food", "street food"],
    rules: [
      {
        id: "osaka-specific-stops",
        title: "Name exact stops",
        description:
          "Include neighborhood, station, or market names so travelers can place the route on a map.",
      },
      {
        id: "osaka-queue-timing",
        title: "Share queue timing",
        description:
          "Popular shops change the route flow, so add the time of day when you visited or checked.",
      },
    ],
    postFlairs: [
      { id: "flair-osaka-food", label: "Food Route", tone: "food" },
      { id: "flair-osaka-question", label: "Question", tone: "question" },
    ],
    userFlairs: [
      { id: "user-flair-osaka-local", label: "Osaka Local", tone: "reliable" },
      { id: "user-flair-market-scout", label: "Market Scout", tone: "food" },
    ],
    bookmarks: [
      { id: "bookmark-dotonbori", label: "Dotonbori route" },
      { id: "bookmark-osaka-queues", label: "Queue timing" },
    ],
    memberCount: 6800,
    postCount: 77,
    createdById: "user-mika",
  },
  {
    id: "group-seoul-cafe-hops",
    name: "Seoul Cafe Hops",
    avatarUrl:
      "https://images.unsplash.com/photo-1535189043414-47a3c49a0bed?auto=format&fit=crop&w=96&h=96",
    description:
      "Cafe routes, dessert neighborhoods, photo-friendly streets, and transit-aware Seoul days.",
    country: "South Korea",
    places: ["Seoul", "Seongsu", "Hongdae", "Ikseon-dong"],
    tags: ["seoul", "cafe", "coffee", "dessert"],
    rules: [
      {
        id: "seoul-cafe-hours",
        title: "Check current hours",
        description:
          "Cafe hours change often, so mention when your information was last confirmed.",
      },
      {
        id: "seoul-cafe-neighborhood",
        title: "Keep hops local",
        description:
          "Group recommendations by neighborhood unless the transit time is part of the route.",
      },
    ],
    postFlairs: [
      { id: "flair-seoul-cafe", label: "Cafe Route", tone: "itinerary" },
      { id: "flair-seoul-question", label: "Question", tone: "question" },
    ],
    userFlairs: [
      { id: "user-flair-seoul-local", label: "Seoul Local", tone: "reliable" },
      { id: "user-flair-cafe-scout", label: "Cafe Scout", tone: "food" },
    ],
    bookmarks: [
      { id: "bookmark-seongsu", label: "Seongsu cafes" },
      { id: "bookmark-seoul-rain", label: "Rainy-day backup" },
    ],
    memberCount: 5900,
    postCount: 64,
    createdById: "user-mika",
  },
  {
    id: "group-vietnam-coastal-routes",
    name: "Vietnam Coastal Routes",
    avatarUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=96&h=96",
    description:
      "Seafood, train hops, scooters, viewpoints, and weather windows along Vietnam's coast.",
    country: "Vietnam",
    places: ["Da Nang", "Hoi An", "Nha Trang", "Hue"],
    tags: ["vietnam", "coastal", "seafood", "road trip"],
    rules: [
      {
        id: "vietnam-weather",
        title: "Include season context",
        description:
          "Coastal routes depend on rain, heat, and sea conditions, so share the travel month.",
      },
      {
        id: "vietnam-transport",
        title: "State transport mode",
        description:
          "Tell others whether the route assumes scooter, car, train, taxi, or walking.",
      },
    ],
    postFlairs: [
      { id: "flair-vietnam-route", label: "Coastal Route", tone: "itinerary" },
      { id: "flair-vietnam-food", label: "Seafood", tone: "food" },
    ],
    userFlairs: [
      { id: "user-flair-coast-local", label: "Coast Local", tone: "reliable" },
      { id: "user-flair-scooter", label: "Scooter Planner", tone: "itinerary" },
    ],
    bookmarks: [
      { id: "bookmark-da-nang", label: "Da Nang notes" },
      { id: "bookmark-vietnam-weather", label: "Weather windows" },
    ],
    memberCount: 7200,
    postCount: 86,
    createdById: "user-pim",
  },
  {
    id: "group-bali-sunset-stops",
    name: "Bali Sunset Stops",
    avatarUrl:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=96&h=96",
    description:
      "Beach clubs, sunset viewpoints, scooter timing, and dinner routes around Bali.",
    country: "Indonesia",
    places: ["Bali", "Canggu", "Uluwatu", "Ubud"],
    tags: ["bali", "beach", "sunset", "restaurant"],
    rules: [
      {
        id: "bali-traffic",
        title: "Mention traffic assumptions",
        description:
          "Sunset timing is fragile, so include drive estimates and backup stops.",
      },
      {
        id: "bali-safety",
        title: "Avoid unsafe access tips",
        description:
          "Do not suggest closed paths, risky cliff access, or illegal parking shortcuts.",
      },
    ],
    postFlairs: [
      { id: "flair-bali-sunset", label: "Sunset Route", tone: "itinerary" },
      { id: "flair-bali-food", label: "Dinner Stop", tone: "food" },
    ],
    userFlairs: [
      { id: "user-flair-bali-local", label: "Bali Local", tone: "reliable" },
      { id: "user-flair-sunset-scout", label: "Sunset Scout", tone: "itinerary" },
    ],
    bookmarks: [
      { id: "bookmark-uluwatu", label: "Uluwatu sunset" },
      { id: "bookmark-bali-traffic", label: "Traffic timing" },
    ],
    memberCount: 8100,
    postCount: 101,
    createdById: "user-pim",
  },
  {
    id: "group-singapore-food-courts",
    name: "Singapore Food Courts",
    avatarUrl:
      "https://images.unsplash.com/photo-1565967511849-76a60a516170?auto=format&fit=crop&w=96&h=96",
    description:
      "Hawker centers, mall food courts, MRT-friendly loops, and heat-proof Singapore eating days.",
    country: "Singapore",
    places: ["Singapore", "Maxwell", "Tiong Bahru", "Katong"],
    tags: ["singapore", "food", "hawker", "city break"],
    rules: [
      {
        id: "singapore-stall-specific",
        title: "Name the stall",
        description:
          "Food court advice should include stall names, nearest MRT, and realistic opening windows.",
      },
      {
        id: "singapore-heat",
        title: "Plan for heat and rain",
        description:
          "Add indoor backups or shade breaks when proposing longer walking routes.",
      },
    ],
    postFlairs: [
      { id: "flair-singapore-hawker", label: "Hawker Route", tone: "food" },
      { id: "flair-singapore-question", label: "Question", tone: "question" },
    ],
    userFlairs: [
      { id: "user-flair-sg-local", label: "Singapore Local", tone: "reliable" },
      { id: "user-flair-hawker-scout", label: "Hawker Scout", tone: "food" },
    ],
    bookmarks: [
      { id: "bookmark-maxwell", label: "Maxwell guide" },
      { id: "bookmark-mrt-food", label: "MRT food loops" },
    ],
    memberCount: 6300,
    postCount: 71,
    createdById: "user-kanya",
  },
  {
    id: "group-taiwan-night-markets",
    name: "Taiwan Night Markets",
    avatarUrl:
      "https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?auto=format&fit=crop&w=96&h=96",
    description:
      "Snack pacing, train-friendly night market loops, rainy-evening plans, and Taiwan city hops.",
    country: "Taiwan",
    places: ["Taipei", "Taichung", "Tainan", "Kaohsiung"],
    tags: ["taiwan", "night market", "food", "city break"],
    rules: [
      {
        id: "taiwan-market-pacing",
        title: "Pace the snack route",
        description:
          "Share what to skip, split, or save for later so routes stay realistic.",
      },
      {
        id: "taiwan-transit",
        title: "Add transit context",
        description:
          "Night market routes should include nearest station, taxi assumptions, or walking time.",
      },
    ],
    postFlairs: [
      { id: "flair-taiwan-market", label: "Night Market", tone: "food" },
      { id: "flair-taiwan-itinerary", label: "City Loop", tone: "itinerary" },
    ],
    userFlairs: [
      { id: "user-flair-taiwan-local", label: "Taiwan Local", tone: "reliable" },
      { id: "user-flair-snack-scout", label: "Snack Scout", tone: "food" },
    ],
    bookmarks: [
      { id: "bookmark-taipei-markets", label: "Taipei markets" },
      { id: "bookmark-taiwan-rain", label: "Rain backups" },
    ],
    memberCount: 5700,
    postCount: 68,
    createdById: "user-narin",
  },
];

export const mockCommunityPosts: CommunityPost[] = [
  {
    id: "post-bangkok-restaurant-loop",
    groupId: "group-thailand-restaurants",
    authorId: "user-kanya",
    title: "Best Bangkok restaurant loop if you only have two nights?",
    body:
      "I built a Bangkok food route that keeps dinner, dessert, and river breaks close together. Would you swap any restaurants around Yaowarat or old town?",
    createdAt: "2026-05-10T20:35:00+07:00",
    upvotes: 286,
    commentCount: 14,
    tags: ["restaurant", "bangkok", "thailand", "food"],
    place: "Bangkok",
    country: "Thailand",
    sharedTripId: "trip-bangkok-food-loop",
    flairId: "flair-food",
    imageUrl:
      "https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "post-restaurant-thailand-general",
    groupId: "group-thailand-restaurants",
    authorId: "user-pim",
    title: "Restaurant-heavy Thailand trip: Bangkok, Chiang Mai, then Phuket",
    body:
      "Friends want the trip to be mostly restaurants and local markets. I am comparing north-first vs beach-first routes and would love pacing advice.",
    createdAt: "2026-05-09T18:15:00+07:00",
    upvotes: 214,
    commentCount: 9,
    tags: ["restaurant", "thailand", "phuket", "chiang mai"],
    place: "Thailand",
    country: "Thailand",
    sharedTripId: "trip-phuket-seafood",
    flairId: "flair-question",
  },
  {
    id: "post-khao-soi-weekend",
    groupId: "group-chiang-mai-cafes",
    authorId: "user-narin",
    title: "Chiang Mai khao soi crawl without overpacking the day",
    body:
      "This trip keeps one main restaurant stop per half-day, then adds cafes and a mountain view. I want it to feel relaxed, not like a checklist.",
    createdAt: "2026-05-08T12:40:00+07:00",
    upvotes: 173,
    commentCount: 11,
    tags: ["restaurant", "chiang mai", "khao soi", "thailand"],
    place: "Chiang Mai",
    country: "Thailand",
    sharedTripId: "trip-chiang-mai-khao-soi",
    flairId: "flair-khao-soi",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "post-phuket-seafood",
    groupId: "group-phuket-coast",
    authorId: "user-pim",
    title: "Rawai seafood before or after sunset viewpoints?",
    body:
      "I am trying to avoid the worst parking hours. Has anyone copied this kind of Phuket seafood trip and reordered it successfully?",
    createdAt: "2026-05-07T21:05:00+07:00",
    upvotes: 121,
    commentCount: 7,
    tags: ["restaurant", "seafood", "phuket", "thailand"],
    place: "Phuket",
    country: "Thailand",
    sharedTripId: "trip-phuket-seafood",
    flairId: "flair-seafood",
    imageUrl:
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "post-khao-yai-charging",
    groupId: "group-thailand-ev-charging",
    authorId: "user-arthit",
    title: "Khao Yai lunch spots that pair well with reliable charging",
    body:
      "I attached a route with charger-friendly restaurant breaks near Pak Chong and Khao Yai. The main question is whether stop two should be before the vineyard.",
    createdAt: "2026-05-06T10:20:00+07:00",
    upvotes: 98,
    commentCount: 5,
    tags: ["ev", "charging", "restaurant", "khao yai", "thailand"],
    place: "Khao Yai",
    country: "Thailand",
    sharedTripId: "trip-khao-yai-charge",
    flairId: "flair-ev-route",
    imageUrl:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "post-tokyo-ramen",
    groupId: "group-tokyo-restaurant-routes",
    authorId: "user-mika",
    title: "Tokyo ramen crawl: too much for two days?",
    body:
      "Restaurant search should not stop at Thailand, so here is a Tokyo example. I am keeping neighborhoods compact to avoid transit fatigue.",
    createdAt: "2026-05-05T09:10:00+09:00",
    upvotes: 87,
    commentCount: 6,
    tags: ["restaurant", "tokyo", "ramen", "japan"],
    place: "Tokyo",
    country: "Japan",
    sharedTripId: "trip-tokyo-ramen",
    flairId: "flair-ramen",
    imageUrl:
      "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "post-bangkok-dessert",
    groupId: "group-bangkok-food",
    authorId: "user-kanya",
    title: "Where would you place dessert on a Bangkok food route?",
    body:
      "I like dessert after the riverside segment, but some friends say it is better to stay near Chinatown and skip the taxi hop.",
    createdAt: "2026-05-04T22:00:00+07:00",
    upvotes: 69,
    commentCount: 8,
    tags: ["bangkok", "food", "dessert", "restaurant"],
    place: "Bangkok",
    country: "Thailand",
    flairId: "flair-question-bkk",
  },
];

export const mockCommunityComments: CommunityComment[] = [
  {
    id: "comment-bangkok-1",
    postId: "post-bangkok-restaurant-loop",
    authorId: "user-narin",
    body:
      "I copied the loop and would move the riverside dinner earlier. Traffic felt easier before 6 PM.",
    createdAt: "2026-05-10T21:00:00+07:00",
    upvotes: 22,
  },
  {
    id: "comment-bangkok-2",
    postId: "post-bangkok-restaurant-loop",
    authorId: "user-pim",
    body:
      "Keep Yaowarat late. The food options feel better after sunset and the route has more energy.",
    createdAt: "2026-05-10T21:18:00+07:00",
    upvotes: 18,
  },
  {
    id: "comment-bangkok-3",
    postId: "post-bangkok-restaurant-loop",
    parentCommentId: "comment-bangkok-1",
    authorId: "user-kanya",
    body:
      "Good call. I would also keep the ferry segment optional in case rain slows the river crossing.",
    createdAt: "2026-05-10T21:36:00+07:00",
    upvotes: 12,
  },
  {
    id: "comment-bangkok-4",
    postId: "post-bangkok-restaurant-loop",
    parentCommentId: "comment-bangkok-1",
    authorId: "user-arthit",
    body:
      "If you drive, parking near the riverside stop is the real bottleneck. Taxi plus walking was easier.",
    createdAt: "2026-05-10T22:04:00+07:00",
    upvotes: 8,
  },
  {
    id: "comment-bangkok-5",
    postId: "post-bangkok-restaurant-loop",
    parentCommentId: "comment-bangkok-4",
    authorId: "user-narin",
    body:
      "Agreed. We used the same swap and it saved about twenty minutes after dinner.",
    createdAt: "2026-05-10T22:22:00+07:00",
    upvotes: 5,
  },
  {
    id: "comment-bangkok-6",
    postId: "post-bangkok-restaurant-loop",
    parentCommentId: "comment-bangkok-5",
    authorId: "user-pim",
    body:
      "That makes the late dessert stop more realistic too. I would keep one backup shop pinned.",
    createdAt: "2026-05-10T22:49:00+07:00",
    upvotes: 4,
  },
  {
    id: "comment-bangkok-7",
    postId: "post-bangkok-restaurant-loop",
    parentCommentId: "comment-bangkok-2",
    authorId: "user-mika",
    body:
      "Yaowarat late is worth it, but I would remove one daytime cafe so the whole route breathes.",
    createdAt: "2026-05-11T00:12:00+07:00",
    upvotes: 10,
  },
  {
    id: "comment-bangkok-8",
    postId: "post-bangkok-restaurant-loop",
    parentCommentId: "comment-bangkok-2",
    authorId: "user-current",
    body:
      "Would you keep the dessert stop near Chinatown, or move it closer to the hotel area?",
    createdAt: "2026-05-11T00:40:00+07:00",
    upvotes: 2,
  },
  {
    id: "comment-bangkok-9",
    postId: "post-bangkok-restaurant-loop",
    parentCommentId: "comment-bangkok-8",
    authorId: "user-kanya",
    body:
      "Close to the hotel if the group is new to Bangkok. Chinatown if everyone still has energy.",
    createdAt: "2026-05-11T01:05:00+07:00",
    upvotes: 6,
  },
  {
    id: "comment-bangkok-10",
    postId: "post-bangkok-restaurant-loop",
    parentCommentId: "comment-bangkok-8",
    authorId: "user-arthit",
    body:
      "I would decide by transit, not dessert quality. The better route is the one people will finish.",
    createdAt: "2026-05-11T01:24:00+07:00",
    upvotes: 4,
  },
  {
    id: "comment-bangkok-11",
    postId: "post-bangkok-restaurant-loop",
    parentCommentId: "comment-bangkok-8",
    authorId: "user-pim",
    body:
      "One more vote for hotel-adjacent dessert if the route already includes sunset and dinner.",
    createdAt: "2026-05-11T01:42:00+07:00",
    upvotes: 3,
  },
  {
    id: "comment-bangkok-12",
    postId: "post-bangkok-restaurant-loop",
    parentCommentId: "comment-bangkok-8",
    authorId: "user-narin",
    body:
      "The only exception is if dessert is the whole point of the night. Then keep the fun stop.",
    createdAt: "2026-05-11T02:03:00+07:00",
    upvotes: 2,
  },
  {
    id: "comment-thailand-1",
    postId: "post-restaurant-thailand-general",
    authorId: "user-kanya",
    body:
      "North-first works if you want cooler evenings before the Phuket part. Food pacing is easier too.",
    createdAt: "2026-05-09T19:02:00+07:00",
    upvotes: 14,
    sharedTripId: "trip-chiang-mai-khao-soi",
  },
  {
    id: "comment-khao-soi-1",
    postId: "post-khao-soi-weekend",
    authorId: "user-arthit",
    body:
      "One restaurant per half-day is the right call. Add a charger check if you drive out to Mae Rim.",
    createdAt: "2026-05-08T13:15:00+07:00",
    upvotes: 9,
  },
  {
    id: "comment-phuket-1",
    postId: "post-phuket-seafood",
    authorId: "user-kanya",
    body:
      "I would do Rawai after sunset. The route feels less rushed and dinner becomes the anchor.",
    createdAt: "2026-05-07T21:35:00+07:00",
    upvotes: 11,
  },
  {
    id: "comment-khao-yai-1",
    postId: "post-khao-yai-charging",
    authorId: "user-narin",
    body:
      "Lunch before the vineyard was calmer for us. The charger queue was lighter around noon.",
    createdAt: "2026-05-06T11:00:00+07:00",
    upvotes: 7,
  },
  {
    id: "comment-tokyo-1",
    postId: "post-tokyo-ramen",
    authorId: "user-kanya",
    body:
      "Two days is fine if you skip backtracking. Group by neighborhood and leave one open slot.",
    createdAt: "2026-05-05T10:25:00+09:00",
    upvotes: 6,
  },
];

export const defaultCreateGroupDraft: CreateGroupDraft = {
  name: "",
  description: "",
  country: "Thailand",
  tags: "",
};

export const defaultCreatePostDraft: CreatePostDraft = {
  title: "",
  body: "",
  groupId: "group-thailand-restaurants",
  place: "Bangkok",
  country: "Thailand",
  tags: "",
  attachTrip: true,
  sharedTripId: "trip-bangkok-food-loop",
};

export function getUserById(userId: string): CommunityUser {
  return (
    communityUsers.find((user) => user.id === userId) ?? currentCommunityUser
  );
}

export function getGroupById(
  groupId: string,
  groups: CommunityGroup[] = mockCommunityGroups,
): CommunityGroup | null {
  return groups.find((group) => group.id === groupId) ?? null;
}

export function getGroupBySlug(
  slug: string,
  groups: CommunityGroup[] = mockCommunityGroups,
): CommunityGroup | null {
  const decodedSlug = decodeURIComponent(slug);

  return (
    groups.find((group) => {
      const nameSlug = slugifyCommunityValue(group.name);

      return (
        nameSlug === decodedSlug ||
        nameSlug === slugifyCommunityValue(decodedSlug) ||
        group.id === decodedSlug
      );
    }) ?? null
  );
}

export function getGroupProfileByGroupId(
  groupId: string,
  group?: CommunityGroup | null,
): CommunityGroupProfile {
  const profile = mockCommunityGroupProfiles.find(
    (item) => item.groupId === groupId,
  );

  if (profile) {
    return profile;
  }

  return {
    groupId,
    bannerUrl: DEFAULT_COMMUNITY_GROUP_BANNER,
    summary:
      group?.description ??
      "A Navio community group for sharing practical planning advice.",
    weeklyVisitorCount: Math.max(0, Math.round((group?.memberCount ?? 0) * 0.2)),
    weeklyContributionCount: Math.max(0, group?.postCount ?? 0),
    moderatorIds: [group?.createdById ?? currentCommunityUser.id],
  };
}

export function getTripById(tripId: string): SharedTrip | null {
  return mockSharedTrips.find((trip) => trip.id === tripId) ?? null;
}

export function getCommentsByPostId(
  postId: string,
  extraComments: CommunityComment[] = [],
): CommunityComment[] {
  return [...mockCommunityComments, ...extraComments]
    .filter((comment) => comment.postId === postId)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
}

export function getCommunityPostSlug(post: Pick<CommunityPost, "id" | "title">) {
  return slugifyCommunityValue(post.title) || post.id;
}

export function getCommunityPostHref(
  group: Pick<CommunityGroup, "name">,
  post: Pick<CommunityPost, "id" | "title">,
) {
  return `/community/${slugifyCommunityValue(group.name)}/${getCommunityPostSlug(
    post,
  )}`;
}

export function getPostByGroupAndSlug(
  groupId: string,
  slug: string,
  posts: CommunityPost[] = mockCommunityPosts,
): CommunityPost | null {
  const decodedSlug = decodeURIComponent(slug);
  const normalizedSlug = slugifyCommunityValue(decodedSlug);

  return (
    posts.find(
      (post) =>
        post.groupId === groupId &&
        (getCommunityPostSlug(post) === decodedSlug ||
          getCommunityPostSlug(post) === normalizedSlug ||
          post.id === decodedSlug),
    ) ?? null
  );
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.at(0))
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function formatCount(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }

  return value.toString();
}

export function formatRelativeTime(dateValue: string): string {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "recently";
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60_000));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.round(diffHours / 24);

  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return date.toLocaleDateString("en", {
    month: "short",
    day: "numeric",
  });
}

export function parseTagList(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

export function slugifyCommunityValue(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

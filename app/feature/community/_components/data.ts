export type CommunityFeedSort = "best" | "new" | "top";

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

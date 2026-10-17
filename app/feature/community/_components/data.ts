export type CommunityFeedSort = "best" | "new" | "top";
export type CommunityCommentSort = "best" | "new";

export type CommunityGroup = {
  status?: string;
  slug?: string;
  joined?: boolean;
  muted?: boolean;
  role?: "member" | "moderator" | "admin" | null;
  profile?: CommunityGroupProfile;
  id: string;
  name: string;
  description: string;
  /** Uploaded community icon, or "" for the generated initial. */
  avatarUrl: string;
  /** Uploaded banner, or "" for the generated contour banner. */
  bannerUrl?: string;
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
  tone:
    | "reliable"
    | "question"
    | "unsourced"
    | "speculation"
    | "itinerary"
    | "food"
    | "ev";
};

export type CommunityBookmark = {
  id: string;
  label: string;
  url?: string | null;
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
  groupSlug?: string;
  groupName?: string;
  groupIconUrl?: string;
  viewerVote?: number;
  linkUrl?: string;
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
  deleted?: boolean;
  edited?: boolean;
  viewerVote?: number;
  id: string;
  postId: string;
  parentCommentId?: string;
  authorId: string;
  body: string;
  createdAt: string;
  upvotes: number;
  sharedTripId?: string;
  reactions?: CommunityReactionSummary[];
};

export type CommunityReaction =
  | "helpful"
  | "love"
  | "funny"
  | "thanks"
  | "want_to_go";

export type CommunityReactionSummary = {
  reaction: CommunityReaction;
  count: number;
  reacted: boolean;
};

export type CreatePostDraft = {
  title: string;
  body: string;
  linkUrl: string;
  groupId: string;
  place: string;
  country: string;
  tags: string;
  /** Share token of the Explore plan this post discusses, or null. */
  planToken: string | null;
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

export const defaultCreatePostDraft: CreatePostDraft = {
  title: "",
  body: "",
  linkUrl: "",
  // Nothing is preselected unless the writer chooses it (or arrives via ?groupId / ?plan).
  groupId: "",
  place: "",
  country: "",
  tags: "",
  planToken: null,
};

export function getCommunityPostHref(
  group: Pick<CommunityGroup, "name" | "slug">,
  post: Pick<CommunityPost, "id">,
) {
  return `/community/${group.slug ?? slugifyCommunityValue(group.name)}/${post.id}`;
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

/** Suggested topics in the create-community flow; members can also type their own. */
export const communityTopicSuggestions = [
  "Road trips",
  "EV charging",
  "Food & night markets",
  "City breaks",
  "Beaches & islands",
  "Hiking & nature",
  "Public transit",
  "Budget travel",
  "Family travel",
  "Solo travel",
  "Photography",
  "Where to stay",
  "Visas & documents",
] as const;

export const MAX_COMMUNITY_TOPICS = 5;

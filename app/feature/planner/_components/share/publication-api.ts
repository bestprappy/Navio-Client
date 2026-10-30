import type { SavedVehicle } from "../../planId/_components/garage/vehicle-api";
import { PlannerApiError, requestJson } from "../planner-api";

/** Mirrors `PublicationOptions`. Every option is off unless the owner turned it on. */
export type PublicationOptions = {
  includeDates: boolean;
  includeNotes: boolean;
  includeBudget: boolean;
  includeStartingPart?: boolean;
  includeGarage?: boolean;
  listIds?: string[];
  excludedVehicleIds?: string[];
  confirmedCustomVehicleIds?: string[];
};

export const NO_PUBLICATION_OPTIONS: PublicationOptions = {
  includeDates: false,
  includeNotes: false,
  includeBudget: false,
};

/** Mirrors `PublicationResponse`; the owner's view, never served anonymously. */
export type Publication =
  | { published: false }
  | {
      published: true;
      token: string;
      options: PublicationOptions;
      revision: number;
      publishedAt: string;
      updatedAt: string | null;
      /** The source trip moved since the snapshot was frozen. Conservative by design. */
      hasUnpublishedChanges: boolean;
      /** Frozen by a superseded sanitiser, so the link no longer resolves until re-published. */
      staleSanitizer: boolean;
      /** Also listed on the public Explore page. */
      listedInExplore: boolean;
      /** The byline shown on the published plan, or null for "a Navio traveler". */
      authorDisplayName: string | null;
      title: string | null;
    };

export type PublicAnchor = { name: string; redacted: boolean };

export type PublicCharger = {
  connectorTypes?: string[];
  maxKw?: number;
  totalConnectors?: number;
  priceText?: string;
  openingHoursSummary?: string;
  operatorName?: string;
};

export type PublicItem = {
  type: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  time?: string;
  timeEnd?: string;
  cost?: number;
  notes?: string;
  noteContent?: string;
  checklistTitle?: string;
  checklistLabels?: string[];
  charger?: PublicCharger;
  placeId?: string;
  address?: string;
  lat?: number;
  lng?: number;
  /** Optional on historical snapshots; applies only to a public stop-to-stop leg. */
  arrivalMode?: "drive" | "transit" | "rail" | "bus" | "bike" | "walk";
  arrivalRouteKey?: string;
  placeType?: string;
  id?: string;
  timeSource?: "fixed"|"calculated";
  schedule?: {id:string;time:string;timeEnd?:string;label:string}[];
  /** Section dividers: palette colour id, and the city's name without coordinates. */
  colorId?: string;
  city?: string;
};

export type PublicDay = {
  label: string;
  date?: string;
  title?: string;
  /** Palette color the owner gave the day; absent on plans published before colors were shared. */
  colorId?: string;
  startsAt?: PublicAnchor;
  endsAt?: PublicAnchor;
  items?: PublicItem[];
};

export type PublicBudget = {
  currency: string;
  amount: number;
  expenses?: { label: string; amount: number; categoryId?: string; itemRef?:string }[];
};

export type PublicTripVehicle={key:string;source:"catalog"|"custom";active:boolean;initialSocPct?:number|null;vehicle:Omit<SavedVehicle,"id"|"createdAt"|"updatedAt"|"isDefault">};

/** Mirrors `PublicPlanSnapshot`: the whole of what a recipient receives. */
export type PublicPlanSnapshot = {
  sanitizerVersion: number;
  title?: string;
  destinationCity?: string;
  destinationCountry?: string;
  startDate?: string;
  endDate?: string;
  dayCount: number;
  days?: PublicDay[];
  budget?: PublicBudget;
  included?: PublicationOptions;
  startingPart?: {title:string;content:string};
  lists?: PublicDay[];
  garage?: PublicTripVehicle[];
};

export type SharedPlanEngagement = {
  viewCount?: number;
  copyCount?: number;
  uniqueCopierCount?: number;
};
export type SharedPlan = {
  plan: PublicPlanSnapshot;
  publishedAt: string;
  /** The owner also listed it on Explore; the Explore detail page serves only these. */
  listedInExplore: boolean;
  /** The owner's byline, or null. A display name only, never an account id. */
  authorName: string | null;
  engagement?: SharedPlanEngagement;
};

function readEngagementCount(value: unknown): number | undefined {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readOptions(value: unknown): PublicationOptions {
  // Anything unreadable resolves to "nothing extra was shared". A settings blob we
  // cannot parse must describe less than reality, never more.
  if (!isRecord(value)) return NO_PUBLICATION_OPTIONS;
  return {
    includeDates: value.includeDates === true,
    includeNotes: value.includeNotes === true,
    includeBudget: value.includeBudget === true,
    ...(typeof value.includeStartingPart==="boolean"?{includeStartingPart:value.includeStartingPart}:{}),
    ...(typeof value.includeGarage==="boolean"?{includeGarage:value.includeGarage}:{}),
    ...Object.fromEntries(["listIds","excludedVehicleIds","confirmedCustomVehicleIds"].filter(key=>Array.isArray(value[key])).map(key=>[key,(value[key] as unknown[]).filter((id):id is string=>typeof id==="string")])),
  };
}

function toPublication(value: unknown): Publication {
  if (!isRecord(value) || value.published !== true) return { published: false };
  if (typeof value.token !== "string" || typeof value.revision !== "number") {
    throw new PlannerApiError("Trip service returned an invalid publication.", 502);
  }
  return {
    published: true,
    token: value.token,
    options: readOptions(value.options),
    revision: value.revision,
    publishedAt: typeof value.publishedAt === "string" ? value.publishedAt : "",
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : null,
    hasUnpublishedChanges: value.hasUnpublishedChanges === true,
    staleSanitizer: value.staleSanitizer === true,
    listedInExplore: value.listedInExplore === true,
    authorDisplayName: readAuthorName(value.authorDisplayName),
    title: readAuthorName(value.title),
  };
}

/** Names travel as display text only; anything else reads as "no name". */
function readAuthorName(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function toSnapshot(value: unknown): PublicPlanSnapshot {
  if (!isRecord(value) || typeof value.sanitizerVersion !== "number") {
    throw new PlannerApiError("Trip service returned an invalid shared plan.", 502);
  }
  return value as unknown as PublicPlanSnapshot;
}

export async function getPublication(tripId: string): Promise<Publication> {
  return toPublication(await requestJson(`/api/trips/${encodeURIComponent(tripId)}/publication`));
}

export async function previewPublication(
  tripId: string,
  options: PublicationOptions,
): Promise<PublicPlanSnapshot> {
  return toSnapshot(
    await requestJson(`/api/trips/${encodeURIComponent(tripId)}/publication/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ options }),
    }),
  );
}

export type PublishPlanPayload = {
  /** The `trip.version` the owner reviewed. A source that moved is rejected, not published. */
  expectedTripVersion: number;
  /** The revision the owner was looking at, or null for a first publish. */
  expectedRevision: number | null;
  options: PublicationOptions;
  /** Also list on Explore. Sent every time: the server reads an absent flag as "unlisted". */
  listInExplore: boolean;
  /** The byline the owner saw in the dialog; null publishes without a name. */
  authorDisplayName: string | null;
  /** Name frozen in the public copy and Explore card. */
  title: string;
};

export async function publishPlan(
  tripId: string,
  payload: PublishPlanPayload,
): Promise<Publication> {
  return toPublication(
    await requestJson(`/api/trips/${encodeURIComponent(tripId)}/publication`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}

/** Lists or unlists a published plan on Explore. Immediate; the shared content is unchanged. */
export async function setExploreListing(
  tripId: string,
  listedInExplore: boolean,
  /** Refreshes the byline when given; null keeps the one already published. */
  authorDisplayName: string | null,
): Promise<Publication> {
  return toPublication(
    await requestJson(`/api/trips/${encodeURIComponent(tripId)}/publication`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listedInExplore, authorDisplayName }),
    }),
  );
}

export async function stopSharingPlan(tripId: string): Promise<void> {
  await requestJson(`/api/trips/${encodeURIComponent(tripId)}/publication`, { method: "DELETE" });
}

/**
 * Reads an anonymous shared plan. Server-only: the recipient page is a Server
 * Component, so no route on this origin serves a token-addressed read and the
 * browser never makes the request itself.
 */
export function readSharedPlanResponse(value: unknown): SharedPlan {
  if (!isRecord(value)) {
    throw new PlannerApiError("Trip service returned an invalid shared plan.", 502);
  }
  return {
    plan: toSnapshot(value.plan),
    publishedAt: typeof value.publishedAt === "string" ? value.publishedAt : "",
    listedInExplore: value.listedInExplore === true,
    authorName: readAuthorName(value.authorName),
    ...(value.listedInExplore === true && isRecord(value.engagement) ? { engagement: {
      viewCount: readEngagementCount(value.engagement.viewCount),
      copyCount: readEngagementCount(value.engagement.copyCount),
      uniqueCopierCount: readEngagementCount(value.engagement.uniqueCopierCount),
    }} : {}),
  };
}

/** The recipient-facing URL. Built here so the path exists in exactly one place. */
export function sharedPlanPath(token: string): string {
  return `/share/plans/${encodeURIComponent(token)}`;
}

export function sharedPlanUrl(token: string): string {
  if (typeof window === "undefined") return sharedPlanPath(token);
  return new URL(sharedPlanPath(token), window.location.origin).toString();
}

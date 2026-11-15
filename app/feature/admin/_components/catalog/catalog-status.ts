import type { CatalogStatus } from "./catalog-api";

export type CatalogStatusFilter = CatalogStatus | null;

type StatusTone = {
  label: string;
  /** Plural label for the filter strip. */
  plural: string;
  /** What the status means for drivers, shown under the count. */
  hint: string;
  dot: string;
  text: string;
  badge: string;
  bar: string;
};

/**
 * One colour per publication state, used by the filter strip, row badges and
 * thumbnails so a status reads the same everywhere. Each tone is paired with a
 * text label: colour is never the only cue.
 */
export const STATUS_TONES: Record<CatalogStatus | "ALL", StatusTone> = {
  ALL: {
    label: "All", plural: "All vehicles", hint: "Every catalog entry",
    dot: "bg-primary", text: "text-primary", badge: "bg-primary/10 text-primary ring-primary/25", bar: "bg-primary",
  },
  PUBLISHED: {
    label: "Published", plural: "Published", hint: "Drivers can select these",
    dot: "bg-success", text: "text-success", badge: "bg-success/12 text-success ring-success/30", bar: "bg-success",
  },
  DRAFT: {
    label: "Draft", plural: "Drafts", hint: "Visible to admins only",
    dot: "bg-warning", text: "text-warning", badge: "bg-warning/12 text-warning ring-warning/30", bar: "bg-warning",
  },
  ARCHIVED: {
    label: "Archived", plural: "Archived", hint: "Hidden from new selections",
    dot: "bg-muted-foreground", text: "text-muted-foreground", badge: "bg-muted text-muted-foreground ring-border", bar: "bg-muted-foreground",
  },
};

export const statusTone = (status: CatalogStatusFilter) => STATUS_TONES[status ?? "ALL"];

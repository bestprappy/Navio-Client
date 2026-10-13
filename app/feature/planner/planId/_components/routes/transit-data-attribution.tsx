import type { RouteSegment } from "./trip-route.types";

/** OTP walking geometry uses OSM even when the base map comes from Google. */
export function TransitDataAttribution({ segments }: { segments: RouteSegment[] }) {
  if (!segments.some(segment => segment.status === "routed" && segment.journeys?.some(journey => journey.provider === "OTP"))) {
    return null;
  }
  return (
    <a
      href="https://www.openstreetmap.org/copyright"
      target="_blank"
      rel="noopener noreferrer"
      className="absolute bottom-8 left-2 z-10 rounded-sm border border-border bg-background/90 px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="Route data: OpenStreetMap contributors. Opens in a new tab."
    >
      Route data: © OpenStreetMap contributors
    </a>
  );
}

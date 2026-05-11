"use client";

import dynamic from "next/dynamic";

// Switch between providers by setting NEXT_PUBLIC_MAP_PROVIDER=mapbox (default: google).
// Only the active provider's bundle is loaded at runtime.
const PlannerMapGoogle = dynamic(
  () =>
    import("./planner-map-google").then((m) => ({
      default: m.PlannerMapGoogle,
    })),
  { ssr: false },
);

const PlannerMapMapbox = dynamic(
  () =>
    import("./planner-map-mapbox").then((m) => ({
      default: m.PlannerMapMapbox,
    })),
  { ssr: false },
);

type PlannerMapProps = {
  latitude: number;
  longitude: number;
};

const MAP_PROVIDER = process.env.NEXT_PUBLIC_MAP_PROVIDER ?? "google";

export function PlannerMap({ latitude, longitude }: PlannerMapProps) {
  if (MAP_PROVIDER === "mapbox") {
    return <PlannerMapMapbox latitude={latitude} longitude={longitude} />;
  }

  return <PlannerMapGoogle latitude={latitude} longitude={longitude} />;
}

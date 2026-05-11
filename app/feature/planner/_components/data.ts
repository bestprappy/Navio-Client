export type PlaceProvider = "GOOGLE" | "MAPBOX";

export type DestinationType = "city" | "region" | "country";

export type Destination = {
  id: string;
  provider: PlaceProvider;
  name: string;
  type: DestinationType;
  country: string;
  sessionToken?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
};

export const destinationTypeLabels: Record<DestinationType, string> = {
  city: "Cities",
  region: "Regions",
  country: "Countries",
};

export const destinationTypes: DestinationType[] = ["city", "region", "country"];

export function inferDestinationType(types: string[]): DestinationType {
  if (types.some((t) => t === "country")) return "country";
  if (
    types.some(
      (t) =>
        t === "region" ||
        t.startsWith("administrative_area_level") ||
        t === "state" ||
        t === "province",
    )
  ) {
    return "region";
  }
  return "city";
}

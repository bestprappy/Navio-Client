export type MapStyleId = "system" | "light" | "dark" | "minimal" | "grayscale" | "muted" | "retro" | "navio";
export type MapAppearance = { style: MapStyleId };

export type MapPalette = {
  land: string;
  water: string;
  park: string;
  road: string;
  highway: string;
  label: string;
  building: string;
};

export const mapAppearanceStorageKey = "navio:map-appearance";
export const defaultMapAppearance: MapAppearance = { style: "system" };

export const mapStyleOptions: { id: MapStyleId; label: string; description: string }[] = [
  { id: "system", label: "Follow app", description: "Match your app's light or dark mode" },
  { id: "light", label: "Light", description: "Google's original map colors" },
  { id: "dark", label: "Dark", description: "Dark streets with clear labels" },
  { id: "minimal", label: "Flat / minimal", description: "Less detail, more room for your route" },
  { id: "grayscale", label: "Grayscale", description: "Quiet shades of gray" },
  { id: "muted", label: "Muted / pastel", description: "Soft greens and blues" },
  { id: "retro", label: "Retro", description: "Warm paper and vintage colors" },
  { id: "navio", label: "Navio", description: "Navio's blue-gray palette" },
];

export const mapPalettes: Record<Exclude<MapStyleId, "system">, MapPalette> = {
  light: { land: "#f4f6f8", water: "#a9d5ef", park: "#d5e5cd", road: "#ffffff", highway: "#e9c77c", label: "#4c5968", building: "#e0e4e9" },
  dark: { land: "#1c2433", water: "#102e46", park: "#263c36", road: "#465268", highway: "#71819c", label: "#ced8e6", building: "#333e52" },
  minimal: { land: "#f5f6f7", water: "#d8e5eb", park: "#e5eae5", road: "#ffffff", highway: "#bdc9d2", label: "#586672", building: "#eceef0" },
  grayscale: { land: "#ededed", water: "#c6c6c6", park: "#dadada", road: "#ffffff", highway: "#a0a0a0", label: "#505050", building: "#d7d7d7" },
  muted: { land: "#eef1ed", water: "#bcd4df", park: "#d2dfcd", road: "#fcfbf7", highway: "#d4c3a1", label: "#55685e", building: "#dce3dc" },
  retro: { land: "#ede4cf", water: "#b7ced0", park: "#cbd2ac", road: "#fff8e6", highway: "#ccaa71", label: "#6b604c", building: "#dfd3b8" },
  navio: { land: "#f1f4fa", water: "#bddcf4", park: "#dbe6e7", road: "#ffffff", highway: "#85b6de", label: "#34445f", building: "#dfe5ef" },
};

export function isMapStyleId(value: unknown): value is MapStyleId {
  return mapStyleOptions.some((option) => option.id === value);
}

export function normalizeMapAppearance(value: unknown): MapAppearance {
  if (!value || typeof value !== "object") return defaultMapAppearance;
  const candidate = value as Record<string, unknown>;
  return {
    style: isMapStyleId(candidate.style) ? candidate.style : defaultMapAppearance.style,
  };
}

export function resolveMapStyle(style: MapStyleId, isDark: boolean): Exclude<MapStyleId, "system"> {
  return style === "system" ? (isDark ? "dark" : "light") : style;
}

/** Local styles for raster maps; all presets, including Dark, avoid a cloud map ID. */
export function getGoogleMapStyles(style: Exclude<MapStyleId, "system">): google.maps.MapTypeStyle[] {
  // An empty array restores Google's basemap after switching from a custom theme.
  if (style === "light") return [];
  const palette = mapPalettes[style];
  return [
    { elementType: "geometry", stylers: [{ color: palette.land }] },
    { elementType: "labels.text.fill", stylers: [{ color: palette.label }] },
    { elementType: "labels.text.stroke", stylers: [{ color: palette.land }] },
    { featureType: "landscape.man_made", elementType: "geometry", stylers: [{ color: palette.building }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: palette.water }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: palette.park }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: palette.road }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: palette.highway }] },
    ...(style === "minimal" ? [
      { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
      { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
    ] : []),
  ];
}

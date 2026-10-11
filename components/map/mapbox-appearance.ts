import type { Map as MapboxMap } from "mapbox-gl";

import type { MapPalette, MapStyleId } from "./map-appearance";

/** Leave itinerary overlays and existing hidden POI layers alone when restyling the basemap. */
export function applyMapboxPalette(map: MapboxMap, palette: MapPalette, style: Exclude<MapStyleId, "system">, originalVisibility: globalThis.Map<string, "visible" | "none">, hidePOIs = false) {
  for (const layer of map.getStyle().layers ?? []) {
    if (layer.id.startsWith("trip-route") || layer.id.startsWith("navio-")) continue;
    const id = layer.id.toLowerCase();
    if (layer.type === "background") map.setPaintProperty(layer.id, "background-color", palette.land);
    if (layer.type === "fill") {
      const color = id.includes("water") ? palette.water : /park|landuse|national/.test(id) ? palette.park : id.includes("building") ? palette.building : palette.land;
      map.setPaintProperty(layer.id, "fill-color", color);
    }
    if (layer.type === "line") {
      const color = id.includes("water") ? palette.water : /motorway|trunk/.test(id) ? palette.highway : /road|street|bridge|tunnel/.test(id) ? palette.road : palette.building;
      map.setPaintProperty(layer.id, "line-color", color);
    }
    if (layer.type === "symbol") {
      map.setPaintProperty(layer.id, "text-color", palette.label);
      map.setPaintProperty(layer.id, "text-halo-color", palette.land);
      if (/poi|transit/.test(id)) {
        if (!originalVisibility.has(layer.id)) originalVisibility.set(layer.id, map.getLayoutProperty(layer.id, "visibility") === "none" ? "none" : "visible");
        map.setLayoutProperty(layer.id, "visibility", style === "minimal" || (hidePOIs && id.includes("poi")) ? "none" : originalVisibility.get(layer.id));
      }
    }
  }
}

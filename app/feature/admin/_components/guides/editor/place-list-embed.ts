import { MapPin, MapPinned } from "lucide-react";

import { createEmbedNode, type NoteEmbed } from "@/components/block-editor/extensions/embed-node";

import { GUIDE_PLACE_EMBED, PLACE_LIST_EMBED } from "../guide-model";
import { createListId } from "../guides.atoms";
import { createEmptyPlaceCardId, GuidePlaceNodeView } from "./guide-place-block";
import { PlaceListNodeView } from "./place-list-block";

/**
 * The guide editor's blocks. "/" adds a place list header, or an empty place
 * card that picks its own place; a list's search and the map add filled cards.
 * Module-level, so the editor sees one stable array.
 */
export const GUIDE_EMBEDS: readonly NoteEmbed[] = [
  {
    ...PLACE_LIST_EMBED,
    label: "Place list",
    icon: MapPinned,
    keywords: ["places", "map", "pins", "spots", "category", "my list", "section"],
    createAttributes: () => ({ listId: createListId() }),
    node: createEmbedNode({ ...PLACE_LIST_EMBED, component: PlaceListNodeView }),
  },
  {
    ...GUIDE_PLACE_EMBED,
    label: "Place card",
    icon: MapPin,
    keywords: ["place", "spot", "pin", "location", "card"],
    placeholderAfter: "Write about this place, or type / for commands",
    createAttributes: () => ({ placeId: createEmptyPlaceCardId() }),
    node: createEmbedNode({ ...GUIDE_PLACE_EMBED, component: GuidePlaceNodeView }),
  },
];

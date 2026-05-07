import { atom } from "jotai";

import {
  getDistanceKm,
  getPlaceResults,
  isPlaceItem,
  mockPremadeLists,
  mockTripBlocks,
  type ActiveSearch,
  type ChecklistItem,
  type ChecklistSubItem,
  type EvCharger,
  type PlaceItem,
  type PlaceSuggestion,
  type PremadeList,
  type TripBlockData,
  type TripBlockItem,
} from "./data";

type AddPremadeListPayload = {
  blockId: string;
  listId: string;
};

type AddItemPayload = {
  blockId: string;
};

type RemoveItemPayload = {
  blockId: string;
  itemId: string;
};

type UpdateBlockTitlePayload = {
  blockId: string;
  title: string;
};

type UpdateNotePayload = {
  blockId: string;
  itemId: string;
  content: string;
};

type UpdatePlacePayload = {
  blockId: string;
  itemId: string;
  updates: Partial<Pick<PlaceItem, "isVisited" | "notes">>;
};

type UpdateChecklistTitlePayload = {
  blockId: string;
  itemId: string;
  title: string;
};

type ChecklistSubItemPayload = {
  blockId: string;
  itemId: string;
  subItemId: string;
};

type UpdateChecklistSubItemPayload = ChecklistSubItemPayload & {
  updates: Partial<Pick<ChecklistSubItem, "checked" | "label">>;
};

type ReorderBlockItemsPayload = {
  blockId: string;
  activeItemId: string;
  overItemId: string;
};

type StartPlaceSearchPayload = {
  blockId: string;
  suggestion: PlaceSuggestion;
};

type SelectSearchResultPayload = {
  index: number;
};

type StepSearchResultPayload = {
  direction: "next" | "previous";
};

type SelectTripPlacePayload = {
  itemId: string;
};

export type TripPlaceAnchor = PlaceItem & {
  blockId: string;
};

export type EvChargerMapResult = {
  charger: EvCharger;
  targetBlockId: string;
  targetPlaceId: string;
  distanceKm: number;
};

function createClientId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function updateBlock(
  blocks: TripBlockData[],
  blockId: string,
  updater: (block: TripBlockData) => TripBlockData,
): TripBlockData[] {
  return blocks.map((block) => (block.id === blockId ? updater(block) : block));
}

function updateItem(
  blocks: TripBlockData[],
  blockId: string,
  itemId: string,
  updater: (item: TripBlockItem) => TripBlockItem,
): TripBlockData[] {
  return updateBlock(blocks, blockId, (block) => ({
    ...block,
    items: block.items.map((item) => (item.id === itemId ? updater(item) : item)),
  }));
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);

  if (!movedItem) {
    return items;
  }

  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
}

function premadeListToChecklist(list: PremadeList): ChecklistItem {
  return {
    id: createClientId("checklist"),
    type: "checklist",
    title: list.title,
    items: list.items.map((label) => ({
      id: createClientId("checklist-item"),
      label,
      checked: false,
    })),
  };
}

function getChargerPlaceId(chargerId: string): string {
  return `ev-charger:${chargerId}`;
}

function getEvChargerDescription(charger: EvCharger): string {
  return `EV charging station - ${charger.connectorTypes.join(", ")} - up to ${charger.maxKw} kW`;
}

export const tripBlocksAtom = atom<TripBlockData[]>(mockTripBlocks);
export const activeBlockIdAtom = atom<string | null>(mockTripBlocks[0]?.id ?? null);
export const activeSearchAtom = atom<ActiveSearch | null>(null);
export const openBlockIdsAtom = atom<string[]>(mockTripBlocks.map((b) => b.id));
export const evChargerResultsAtom = atom<EvChargerMapResult[]>([]);
export const selectedEvChargerIdAtom = atom<string | null>(null);
export const selectedTripPlaceItemIdAtom = atom<string | null>(null);
export const selectedTripPlaceItemIdReadonlyAtom = atom((get) =>
  get(selectedTripPlaceItemIdAtom),
);
export const evChargerLoadingAtom = atom(false);
export const evChargerErrorAtom = atom<string | null>(null);

export const toggleBlockOpenAtom = atom(null, (get, set, blockId: string) => {
  const openIds = get(openBlockIdsAtom);
  const isOpen = openIds.includes(blockId);
  set(
    openBlockIdsAtom,
    isOpen ? openIds.filter((id) => id !== blockId) : [...openIds, blockId],
  );
});

export const selectedTripPlacesAtom = atom((get) =>
  get(tripBlocksAtom).flatMap((block) => block.items.filter(isPlaceItem)),
);

export const selectedTripPlaceAnchorsAtom = atom<TripPlaceAnchor[]>((get) =>
  get(tripBlocksAtom).flatMap((block) =>
    block.items
      .filter(isPlaceItem)
      .filter((item) => !item.placeId.startsWith("ev-charger:"))
      .map((item) => ({
        ...item,
        blockId: block.id,
      })),
  ),
);

export const selectedTripPlaceAtom = atom<TripPlaceAnchor | null>((get) => {
  const selectedItemId = get(selectedTripPlaceItemIdAtom);

  if (!selectedItemId) {
    return null;
  }

  return (
    get(tripBlocksAtom).flatMap((block) =>
      block.items.filter(isPlaceItem).map((item) => ({
        ...item,
        blockId: block.id,
      })),
    ).find((item) => item.id === selectedItemId) ?? null
  );
});

export const selectedSearchPlaceAtom = atom((get) => {
  const activeSearch = get(activeSearchAtom);

  if (!activeSearch) {
    return null;
  }

  return activeSearch.results[activeSearch.selectedIndex] ?? null;
});

export const selectedSearchPlaceIsAddedAtom = atom((get) => {
  const activeSearch = get(activeSearchAtom);
  const selectedPlace = get(selectedSearchPlaceAtom);

  if (!activeSearch || !selectedPlace) {
    return false;
  }

  const activeBlock = get(tripBlocksAtom).find(
    (block) => block.id === activeSearch.blockId,
  );

  return Boolean(
    activeBlock?.items.some(
      (item) => isPlaceItem(item) && item.placeId === selectedPlace.id,
    ),
  );
});

export const selectedEvChargerResultAtom = atom((get) => {
  const selectedId = get(selectedEvChargerIdAtom);

  if (!selectedId) {
    return null;
  }

  return (
    get(evChargerResultsAtom).find((result) => result.charger.id === selectedId) ??
    null
  );
});

export const selectedEvChargerIsAddedAtom = atom((get) => {
  const selectedResult = get(selectedEvChargerResultAtom);

  if (!selectedResult) {
    return false;
  }

  const targetBlock = get(tripBlocksAtom).find(
    (block) => block.id === selectedResult.targetBlockId,
  );
  const chargerPlaceId = getChargerPlaceId(selectedResult.charger.id);

  return Boolean(
    targetBlock?.items.some(
      (item) => isPlaceItem(item) && item.placeId === chargerPlaceId,
    ),
  );
});

export const selectEvChargerAtom = atom(null, (_get, set, chargerId: string) => {
  set(activeSearchAtom, null);
  set(selectedTripPlaceItemIdAtom, null);
  set(selectedEvChargerIdAtom, chargerId);
});

export const closeSelectedEvChargerAtom = atom(null, (_get, set) => {
  set(selectedEvChargerIdAtom, null);
});

export const setEvChargerResultsAtom = atom(
  null,
  (_get, set, results: EvChargerMapResult[]) => {
    set(evChargerResultsAtom, results);
    set(selectedEvChargerIdAtom, (selectedId) =>
      selectedId && results.some((result) => result.charger.id === selectedId)
        ? selectedId
        : null,
    );
  },
);

export const clearEvChargerResultsAtom = atom(null, (_get, set) => {
  set(evChargerResultsAtom, []);
  set(selectedEvChargerIdAtom, null);
  set(evChargerLoadingAtom, false);
  set(evChargerErrorAtom, null);
});

export const selectTripPlaceAtom = atom(
  null,
  (_get, set, payload: SelectTripPlacePayload) => {
    set(activeSearchAtom, null);
    set(selectedEvChargerIdAtom, null);
    set(selectedTripPlaceItemIdAtom, payload.itemId);
  },
);

export const closeSelectedTripPlaceAtom = atom(null, (_get, set) => {
  set(selectedTripPlaceItemIdAtom, null);
});

export function dedupeEvChargerResults(
  chargersByAnchor: Array<{
    anchor: TripPlaceAnchor;
    chargers: EvCharger[];
  }>,
): EvChargerMapResult[] {
  const byChargerId = new Map<string, EvChargerMapResult>();

  chargersByAnchor.forEach(({ anchor, chargers }) => {
    chargers.forEach((charger) => {
      const distanceKm = getDistanceKm(
        { lat: anchor.lat, lng: anchor.lng },
        charger.location,
      );
      const nextResult: EvChargerMapResult = {
        charger,
        targetBlockId: anchor.blockId,
        targetPlaceId: anchor.id,
        distanceKm,
      };
      const existing = byChargerId.get(charger.id);

      if (!existing || nextResult.distanceKm < existing.distanceKm) {
        byChargerId.set(charger.id, nextResult);
      }
    });
  });

  return [...byChargerId.values()].sort((a, b) => a.distanceKm - b.distanceKm);
}

export const addTripBlockAtom = atom(null, (get, set) => {
  const nextBlock: TripBlockData = {
    id: createClientId("block"),
    title: "Add a title",
    items: [],
  };

  set(tripBlocksAtom, [...get(tripBlocksAtom), nextBlock]);
  set(activeBlockIdAtom, nextBlock.id);
  set(openBlockIdsAtom, [...get(openBlockIdsAtom), nextBlock.id]);
});

export const updateBlockTitleAtom = atom(
  null,
  (get, set, payload: UpdateBlockTitlePayload) => {
    set(
      tripBlocksAtom,
      updateBlock(get(tripBlocksAtom), payload.blockId, (block) => ({
        ...block,
        title: payload.title,
      })),
    );
  },
);

export const addNoteToBlockAtom = atom(
  null,
  (get, set, payload: AddItemPayload) => {
    set(
      tripBlocksAtom,
      updateBlock(get(tripBlocksAtom), payload.blockId, (block) => ({
        ...block,
        items: [
          ...block.items,
          {
            id: createClientId("note"),
            type: "note",
            content: "",
          },
        ],
      })),
    );
  },
);

export const addChecklistToBlockAtom = atom(
  null,
  (get, set, payload: AddItemPayload) => {
    set(
      tripBlocksAtom,
      updateBlock(get(tripBlocksAtom), payload.blockId, (block) => ({
        ...block,
        items: [
          ...block.items,
          {
            id: createClientId("checklist"),
            type: "checklist",
            title: "Add title",
            items: [
              {
                id: createClientId("checklist-item"),
                label: "",
                checked: false,
              },
            ],
          },
        ],
      })),
    );
  },
);

export const addPremadeListToBlockAtom = atom(
  null,
  (get, set, payload: AddPremadeListPayload) => {
    const selectedList = mockPremadeLists.find((list) => list.id === payload.listId);

    if (!selectedList) {
      console.error("Premade list was not found.", {
        component: "TripBuilder",
        operation: "addPremadeListToBlock",
        listId: payload.listId,
      });
      return;
    }

    set(
      tripBlocksAtom,
      updateBlock(get(tripBlocksAtom), payload.blockId, (block) => ({
        ...block,
        items: [...block.items, premadeListToChecklist(selectedList)],
      })),
    );
  },
);

export const removeItemFromBlockAtom = atom(
  null,
  (get, set, payload: RemoveItemPayload) => {
    set(
      tripBlocksAtom,
      updateBlock(get(tripBlocksAtom), payload.blockId, (block) => ({
        ...block,
        items: block.items.filter((item) => item.id !== payload.itemId),
      })),
    );
  },
);

export const updateNoteItemAtom = atom(
  null,
  (get, set, payload: UpdateNotePayload) => {
    set(
      tripBlocksAtom,
      updateItem(get(tripBlocksAtom), payload.blockId, payload.itemId, (item) =>
        item.type === "note" ? { ...item, content: payload.content } : item,
      ),
    );
  },
);

export const updatePlaceItemAtom = atom(
  null,
  (get, set, payload: UpdatePlacePayload) => {
    set(
      tripBlocksAtom,
      updateItem(get(tripBlocksAtom), payload.blockId, payload.itemId, (item) =>
        item.type === "place" ? { ...item, ...payload.updates } : item,
      ),
    );
  },
);

export const updateChecklistTitleAtom = atom(
  null,
  (get, set, payload: UpdateChecklistTitlePayload) => {
    set(
      tripBlocksAtom,
      updateItem(get(tripBlocksAtom), payload.blockId, payload.itemId, (item) =>
        item.type === "checklist" ? { ...item, title: payload.title } : item,
      ),
    );
  },
);

export const addChecklistSubItemAtom = atom(
  null,
  (get, set, payload: RemoveItemPayload) => {
    set(
      tripBlocksAtom,
      updateItem(get(tripBlocksAtom), payload.blockId, payload.itemId, (item) =>
        item.type === "checklist"
          ? {
              ...item,
              items: [
                ...item.items,
                {
                  id: createClientId("checklist-item"),
                  label: "",
                  checked: false,
                },
              ],
            }
          : item,
      ),
    );
  },
);

export const updateChecklistSubItemAtom = atom(
  null,
  (get, set, payload: UpdateChecklistSubItemPayload) => {
    set(
      tripBlocksAtom,
      updateItem(get(tripBlocksAtom), payload.blockId, payload.itemId, (item) =>
        item.type === "checklist"
          ? {
              ...item,
              items: item.items.map((subItem) =>
                subItem.id === payload.subItemId
                  ? { ...subItem, ...payload.updates }
                  : subItem,
              ),
            }
          : item,
      ),
    );
  },
);

export const removeChecklistSubItemAtom = atom(
  null,
  (get, set, payload: ChecklistSubItemPayload) => {
    set(
      tripBlocksAtom,
      updateItem(get(tripBlocksAtom), payload.blockId, payload.itemId, (item) =>
        item.type === "checklist"
          ? {
              ...item,
              items: item.items.filter((subItem) => subItem.id !== payload.subItemId),
            }
          : item,
      ),
    );
  },
);

export const reorderBlockItemsAtom = atom(
  null,
  (get, set, payload: ReorderBlockItemsPayload) => {
    set(
      tripBlocksAtom,
      updateBlock(get(tripBlocksAtom), payload.blockId, (block) => {
        const fromIndex = block.items.findIndex(
          (item) => item.id === payload.activeItemId,
        );
        const toIndex = block.items.findIndex((item) => item.id === payload.overItemId);

        if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
          return block;
        }

        return {
          ...block,
          items: moveItem(block.items, fromIndex, toIndex),
        };
      }),
    );
  },
);

export const startPlaceSearchAtom = atom(
  null,
  (get, set, payload: StartPlaceSearchPayload) => {
    const results = getPlaceResults(payload.suggestion.searchKey);

    set(activeBlockIdAtom, payload.blockId);
    set(selectedEvChargerIdAtom, null);
    set(selectedTripPlaceItemIdAtom, null);
    set(activeSearchAtom, {
      blockId: payload.blockId,
      query: payload.suggestion.searchKey,
      results,
      selectedIndex: 0,
    });
  },
);

export const selectSearchResultAtom = atom(
  null,
  (get, set, payload: SelectSearchResultPayload) => {
    const activeSearch = get(activeSearchAtom);

    if (!activeSearch || !activeSearch.results.length) {
      return;
    }

    const lastIndex = activeSearch.results.length - 1;
    const nextIndex = Math.min(Math.max(payload.index, 0), lastIndex);

    set(selectedEvChargerIdAtom, null);
    set(selectedTripPlaceItemIdAtom, null);
    set(activeSearchAtom, {
      ...activeSearch,
      selectedIndex: nextIndex,
    });
  },
);

export const stepSearchResultAtom = atom(
  null,
  (get, set, payload: StepSearchResultPayload) => {
    const activeSearch = get(activeSearchAtom);

    if (!activeSearch || !activeSearch.results.length) {
      return;
    }

    const lastIndex = activeSearch.results.length - 1;
    const selectedIndex =
      payload.direction === "next"
        ? activeSearch.selectedIndex >= lastIndex
          ? 0
          : activeSearch.selectedIndex + 1
        : activeSearch.selectedIndex <= 0
          ? lastIndex
          : activeSearch.selectedIndex - 1;

    set(activeSearchAtom, {
      ...activeSearch,
      selectedIndex,
    });
  },
);

export const closeActiveSearchAtom = atom(null, (_get, set) => {
  set(activeSearchAtom, null);
});

export const addSelectedPlaceToTripAtom = atom(null, (get, set) => {
  const activeSearch = get(activeSearchAtom);
  const selectedPlace = get(selectedSearchPlaceAtom);

  if (!activeSearch || !selectedPlace) {
    return;
  }

  const activeBlock = get(tripBlocksAtom).find(
    (block) => block.id === activeSearch.blockId,
  );
  const existingPlace = activeBlock?.items.find(
    (item) => isPlaceItem(item) && item.placeId === selectedPlace.id,
  );
  const nextPlaceId = existingPlace?.id ?? createClientId("place");

  set(
    tripBlocksAtom,
    updateBlock(get(tripBlocksAtom), activeSearch.blockId, (block) => {
      const isAlreadyAdded = block.items.some(
        (item) => isPlaceItem(item) && item.placeId === selectedPlace.id,
      );

      if (isAlreadyAdded) {
        return block;
      }

      return {
        ...block,
        items: [
          ...block.items,
          {
            id: nextPlaceId,
            type: "place",
            placeId: selectedPlace.id,
            name: selectedPlace.name,
            description: selectedPlace.description,
            address: selectedPlace.address,
            lat: selectedPlace.lat,
            lng: selectedPlace.lng,
            rating: selectedPlace.rating,
            imageUrl: selectedPlace.imageUrl,
            isVisited: false,
          },
        ],
      };
    }),
  );
  set(activeSearchAtom, null);
  set(selectedTripPlaceItemIdAtom, nextPlaceId);
});

export const addSelectedEvChargerToTripAtom = atom(null, (get, set) => {
  const selectedResult = get(selectedEvChargerResultAtom);

  if (!selectedResult) {
    return;
  }

  const { charger, targetBlockId } = selectedResult;
  const chargerPlaceId = getChargerPlaceId(charger.id);
  const targetBlock = get(tripBlocksAtom).find((block) => block.id === targetBlockId);
  const existingPlace = targetBlock?.items.find(
    (item) => isPlaceItem(item) && item.placeId === chargerPlaceId,
  );
  const nextPlaceId = existingPlace?.id ?? createClientId("place");

  set(
    tripBlocksAtom,
    updateBlock(get(tripBlocksAtom), targetBlockId, (block) => {
      const isAlreadyAdded = block.items.some(
        (item) => isPlaceItem(item) && item.placeId === chargerPlaceId,
      );

      if (isAlreadyAdded) {
        return block;
      }

      return {
        ...block,
        items: [
          ...block.items,
          {
            id: nextPlaceId,
            type: "place",
            placeId: chargerPlaceId,
            name: charger.name,
            description: getEvChargerDescription(charger),
            address: charger.address ?? charger.location.address ?? "EV charging station",
            lat: charger.location.lat,
            lng: charger.location.lng,
            rating: charger.ratingAvg,
            isVisited: false,
          },
        ],
      };
    }),
  );
  set(selectedEvChargerIdAtom, null);
  set(selectedTripPlaceItemIdAtom, nextPlaceId);
});

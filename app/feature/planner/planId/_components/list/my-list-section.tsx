"use client";

import { useEffect, useRef } from "react";
import { LayoutList, ListChecks, Plus } from "lucide-react";
import { useAtom, useAtomValue, useSetAtom, useStore } from "jotai";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

import { TripBlock } from "../block/trip-block";
import {
  addMyListBlockAtom,
  myListBlocksAtom,
} from "../overview/trip-builder.atoms";
import { EmptyMyListCallout } from "./empty-my-list-callout";
import { InlineAddDivider } from "../inline-add-divider";
import { visibleMyListBlocks } from "./saved-places-model";
import { myListViewAtom, type MyListView } from "./saved-places.atoms";
import { MyListSummary } from "./my-list-summary";
import { ViewSwitch, type ViewSwitchOption } from "../layout/view-switch";

const VIEWS: readonly ViewSwitchOption<MyListView>[] = [
  { id: "planner", label: "Planner", Icon: LayoutList },
  { id: "summary", label: "Summary", Icon: ListChecks },
];

type MyListSectionProps = {
  destinationName: string;
  latitude: number;
  longitude: number;
  createDefaultList?: boolean;
};

export function MyListSection({
  destinationName,
  latitude,
  longitude,
  createDefaultList = true,
}: MyListSectionProps) {
  const listBlocks = useAtomValue(myListBlocksAtom);
  const visibleBlocks = visibleMyListBlocks(listBlocks);
  const addMyListBlock = useSetAtom(addMyListBlockAtom);
  const [view, setView] = useAtom(myListViewAtom);
  const store = useStore();
  const hasEnsuredDefaultList = useRef(false);

  useEffect(() => {
    if (
      !createDefaultList ||
      hasEnsuredDefaultList.current ||
      listBlocks.length > 0
    ) {
      return;
    }

    if (store.get(myListBlocksAtom).length > 0) {
      hasEnsuredDefaultList.current = true;
      return;
    }

    hasEnsuredDefaultList.current = true;
    addMyListBlock();
  }, [addMyListBlock, createDefaultList, listBlocks.length, store]);

  return (
    <section className="px-4 py-4">
      <Accordion defaultValue={["my-list"]}>
        <AccordionItem value="my-list" className="border-none">
          <div className="mb-6 flex items-center justify-between">
            <AccordionTrigger
              iconSide="left"
              className="items-center py-0 text-2xl font-bold text-foreground hover:text-primary hover:no-underline"
            >
              My List
            </AccordionTrigger>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mr-6 rounded-full"
              onClick={(event) => {
                event.stopPropagation();
                addMyListBlock();
              }}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <Plus className="size-3.5" aria-hidden="true" />
              New list
            </Button>
          </div>

          <AccordionContent className="pt-0">
            {listBlocks.length === 0 ? (
              <EmptyMyListCallout onCreateList={addMyListBlock} />
            ) : (
              <div className="mb-4 border-b border-border/60 pb-4">
                <ViewSwitch label="My List view" views={VIEWS} value={view} onChange={setView} />
              </div>
            )}
            {listBlocks.length > 0 && view === "summary" ? (
              <div className="pb-8"><MyListSummary /></div>
            ) : (
              <div className="space-y-8 pb-8 pt-2">
                {visibleBlocks.map((block) => (
                  <TripBlock.Root key={block.id} block={block}>
                    <TripBlock.Header>
                      <TripBlock.Title />
                    </TripBlock.Header>
                    <TripBlock.Content>
                      <TripBlock.Items />
                      <TripBlock.Actions
                        evSearchAnchor={{
                          id: `destination-${block.id}`,
                          lat: latitude,
                          lng: longitude,
                        }}
                        placeSearchBias={{
                          label: destinationName,
                          lat: latitude,
                          lng: longitude,
                        }}
                      />
                    </TripBlock.Content>
                  </TripBlock.Root>
                ))}
  
                {visibleBlocks.length > 0 && (
                  <InlineAddDivider
                    onClick={addMyListBlock}
                    label="Add new list"
                  />
                )}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}

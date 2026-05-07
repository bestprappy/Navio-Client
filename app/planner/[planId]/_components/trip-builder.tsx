"use client";

import { Plus } from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";

import { Button } from "@/components/ui/button";

import { addTripBlockAtom, tripBlocksAtom } from "./trip-builder.atoms";
import { TripBlock } from "./trip-block";

export function TripBuilder() {
  const blocks = useAtomValue(tripBlocksAtom);
  const addTripBlock = useSetAtom(addTripBlockAtom);

  return (
    <section className=" pb-10 pt-2 flex flex-col">
      <div className="space-y-4 ">
        {blocks.map((block) => (
          <TripBlock.Root key={block.id} block={block} className="mb-12">
            <TripBlock.Header>
              <TripBlock.Title />
            </TripBlock.Header>
            <TripBlock.Content>
              <TripBlock.Items />
              <TripBlock.Actions />
            </TripBlock.Content>
          </TripBlock.Root>
        ))}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className=" py-5 mx-8 rounded-sm border border-dashed border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/60 dark:border-primary/30 dark:bg-primary/7 dark:hover:bg-primary/13 dark:hover:border-primary/50 transition-colors"
        onClick={() => addTripBlock()}
      >
        <Plus className="size-4" aria-hidden="true" />
        Add block
      </Button>
    </section>
  );
}

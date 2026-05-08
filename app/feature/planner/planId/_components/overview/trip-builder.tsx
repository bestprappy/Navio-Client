"use client";

import { useAtomValue } from "jotai";

import { tripBlocksAtom } from "./trip-builder.atoms";
import { TripBlock } from "../block/trip-block";

export function TripBuilder() {
  const blocks = useAtomValue(tripBlocksAtom);

  return (
    <div className="space-y-4">
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
  );
}

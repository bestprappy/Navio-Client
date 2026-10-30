"use client";

import { useState } from "react";
import { atom, useAtomValue, useSetAtom } from "jotai";
import { Plus, Signpost, Trash2, Undo2 } from "lucide-react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { NoteEditor } from "@/components/block-editor/note-editor";

import { PlaceNotesPreview } from "../block/items/place-notes";
import type { TripBlockData } from "../constants/types";
import { plannerReadOnlyAtom, tripBlocksAtom } from "../overview/trip-builder.atoms";

const STARTING_PART_ID = "starting-part-main";
const startingPartAtom = atom((get) => get(tripBlocksAtom).find((block) => block.id.startsWith("starting-part-")));

function createStartingPart(): TripBlockData {
  return {
    id: STARTING_PART_ID, kind: "list", title: "Before you go", date: new Date().toISOString().slice(0, 10),
    colorId: "teal", items: [{ id: "starting-part-note", type: "note", content: "" }],
  };
}

/**
 * The planner's first section: the owner's note that readers see before
 * Explore and the itinerary. A shared plan without one shows nothing.
 */
export function BeforeYouGoSection() {
  const block = useAtomValue(startingPartAtom);
  const readOnly = useAtomValue(plannerReadOnlyAtom);
  const setBlocks = useSetAtom(tripBlocksAtom);
  const [removed, setRemoved] = useState<TripBlockData | null>(null);

  if (readOnly && !block) return null;

  const note = block?.items.find((item) => item.type === "note");
  const updateNote = (content: string) => {
    if (readOnly || !block) return;
    setBlocks((blocks) => blocks.map((entry) => entry.id !== block.id ? entry : {
      ...entry, items: entry.items.map((item) => item.type === "note" ? { ...item, content } : item),
    }));
  };
  const add = () => {
    setRemoved(null);
    setBlocks((blocks) => blocks.some((entry) => entry.id.startsWith("starting-part-")) ? blocks : [createStartingPart(), ...blocks]);
  };
  const remove = () => {
    if (!block) return;
    setRemoved(block);
    setBlocks((blocks) => blocks.filter((entry) => entry.id !== block.id));
  };

  return (
    <section className="mt-4 px-4 py-4">
      <Accordion defaultValue={["before-you-go"]}>
        <AccordionItem value="before-you-go" className="border-none">
          <div className="flex items-center justify-between gap-3">
            <AccordionTrigger iconSide="left" className="py-0 text-2xl font-bold tracking-tight hover:no-underline">
              {block?.title.trim() || "Before you go"}
            </AccordionTrigger>
            {!readOnly && (block ? (
              <Button type="button" variant="ghost" size="icon-sm" className="mr-2" aria-label="Remove Before you go" onClick={remove}>
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button type="button" variant="outline" size="sm" className="mr-6 rounded-full" onClick={add}>
                <Plus className="size-3.5" aria-hidden="true" />
                Add note
              </Button>
            ))}
          </div>
          {!readOnly && (
            <p className="mt-2 flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
              <Signpost className="size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>Readers see this first, before Explore and your days.</span>
            </p>
          )}
          {/* The panel's prose margins would space every note line a full rem apart. */}
          <AccordionContent className="pt-4 [&_p]:mb-0">
            {removed && !block && (
              <div role="status" className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                Before you go removed
                <Button type="button" variant="ghost" size="sm" onClick={() => { setBlocks((blocks) => [removed, ...blocks]); setRemoved(null); }}>
                  <Undo2 className="size-3.5" aria-hidden="true" />Undo
                </Button>
              </div>
            )}
            {note?.type === "note" && (
              <div className="max-w-prose text-sm leading-7">
                {readOnly
                  ? <PlaceNotesPreview value={note.content} interactive clamped={false} />
                  : <NoteEditor value={note.content} onChange={updateNote} label="Before you go note" placeholder="Tell readers about your trip. Add headings, helpful tips, links or a list..." />}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}

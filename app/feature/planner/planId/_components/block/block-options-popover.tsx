"use client";

import { type MouseEvent, useState } from "react";
import { Check, MoreHorizontal, Trash2 } from "lucide-react";
import { useSetAtom } from "jotai";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import {
  getTripBlockColorById,
  tripBlockColorOptions,
} from "../constants/trip-block-colors";
import type { TripBlockData } from "../constants/types";
import {
  removeTripBlockAtom,
  updateBlockColorAtom,
} from "../overview/trip-builder.atoms";

type BlockOptionsPopoverProps = {
  block: TripBlockData;
};

function stopHeaderToggle(event: MouseEvent<HTMLElement>) {
  event.stopPropagation();
}

export function BlockOptionsPopover({ block }: BlockOptionsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const removeTripBlock = useSetAtom(removeTripBlockAtom);
  const updateBlockColor = useSetAtom(updateBlockColorAtom);
  const selectedColor = getTripBlockColorById(block.colorId);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        type="button"
        aria-label={`Open options for ${block.title || "this block"}`}
        onClick={stopHeaderToggle}
        onMouseDown={stopHeaderToggle}
        className="flex size-8 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
      >
        <MoreHorizontal className="size-5" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-72 gap-4 rounded-sm p-4"
        onClick={stopHeaderToggle}
        onMouseDown={stopHeaderToggle}
      >
        <PopoverHeader>
          <PopoverTitle>Block options</PopoverTitle>
        </PopoverHeader>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">
            Change color
          </p>
          <div className="grid grid-cols-8 gap-2">
            {tripBlockColorOptions.map((color) => {
              const isSelected = selectedColor.id === color.id;

              return (
                <button
                  key={color.id}
                  type="button"
                  aria-label={`Use ${color.label} for ${block.title || "block"}`}
                  aria-pressed={isSelected}
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full shadow-xs ring-offset-2 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
                    isSelected && "ring-2 ring-foreground/20",
                  )}
                  style={{
                    backgroundColor: color.value,
                    color: color.foreground,
                  }}
                  onClick={() =>
                    updateBlockColor({ blockId: block.id, colorId: color.id })
                  }
                >
                  {isSelected ? (
                    <Check className="size-4" aria-hidden="true" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="w-full justify-start rounded-sm p-4"
          onClick={() => {
            removeTripBlock(block.id);
            setIsOpen(false);
          }}
        >
          <Trash2 className="size-4" aria-hidden="true" />
          Delete this block
        </Button>
      </PopoverContent>
    </Popover>
  );
}

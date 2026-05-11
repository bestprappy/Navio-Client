"use client";

import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Backpack, ListPlus } from "lucide-react";
import { useSetAtom } from "jotai";

import { Button } from "@/components/ui/button";

import { mockPremadeLists } from "../constants/trip.data";
import {
  addPremadeListToBlockAtom,
  addPremadeListToChecklistAtom,
} from "../overview/trip-builder.atoms";

type PremadeListPickerProps = {
  blockId: string;
  itemId?: string;
};

export function PremadeListPicker({ blockId, itemId }: PremadeListPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const addPremadeListToBlock = useSetAtom(addPremadeListToBlockAtom);
  const addPremadeListToChecklist = useSetAtom(addPremadeListToChecklistAtom);

  useEffect(() => {
    if (!isOpen || !wrapperRef.current) return;

    function updatePosition() {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      setMenuStyle({
        top: rect.bottom + window.scrollY + 8,
        left: rect.right + window.scrollX - 288,
        width: 288,
      });
    }

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div
      ref={wrapperRef}
      className={itemId ? "relative" : "relative min-w-40 flex-1"}
      onKeyDown={handleKeyDown}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <Button
        type="button"
        variant="outline"
        size={itemId ? "sm" : "lg"}
        className={
          itemId
            ? "rounded-sm border-violet-300 bg-violet-50 text-violet-700 hover:border-violet-400 hover:bg-violet-100 hover:text-violet-800 dark:border-violet-400/30 dark:bg-violet-400/10 dark:text-violet-100 dark:hover:border-violet-300/50 dark:hover:bg-violet-400/20 dark:hover:text-violet-50"
            : "w-full rounded-sm border-violet-300 bg-violet-50 py-6 text-violet-700 hover:border-violet-400 hover:bg-violet-100 hover:text-violet-800 dark:border-violet-400/30 dark:bg-violet-400/10 dark:text-violet-100 dark:hover:border-violet-300/50 dark:hover:bg-violet-400/20 dark:hover:text-violet-50"
        }
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen((current) => !current)}
      >
        <Backpack className="size-4" aria-hidden="true" />
        Pre-made lists
      </Button>

      {isOpen &&
        menuStyle &&
        createPortal(
          <div
            role="menu"
            style={{
              position: "absolute",
              top: menuStyle.top,
              left: menuStyle.left,
              width: menuStyle.width,
              zIndex: 9999,
            }}
            className="overflow-hidden rounded-md border border-border bg-popover p-2 text-popover-foreground shadow-lg"
          >
            <div className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
              Packing templates
            </div>
            {mockPremadeLists.map((list) => (
              <button
                key={list.id}
                type="button"
                role="menuitem"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (itemId) {
                    addPremadeListToChecklist({
                      blockId,
                      itemId,
                      listId: list.id,
                    });
                  } else {
                    addPremadeListToBlock({ blockId, listId: list.id });
                  }
                  setIsOpen(false);
                }}
                className="flex w-full items-start gap-3 rounded-sm px-3 py-2 text-left transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                <ListPlus
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">
                    {list.title}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {list.items.slice(0, 4).join(", ")}
                  </span>
                </span>
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}

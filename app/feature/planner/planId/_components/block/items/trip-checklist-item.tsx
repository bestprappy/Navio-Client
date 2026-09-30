"use client";

import { Plus, Square, Trash2, X } from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import type { ChecklistItem } from "../../constants/types";
import {
  addChecklistSubItemAtom,
  plannerReadOnlyAtom,
  removeChecklistSubItemAtom,
  removeItemFromBlockAtom,
  updateChecklistSubItemAtom,
  updateChecklistTitleAtom,
} from "../../overview/trip-builder.atoms";
import { PremadeListPicker } from "../../premade/premade-list-picker";

type TripChecklistItemProps = {
  blockId: string;
  item: ChecklistItem;
};

export function TripChecklistItem({ blockId, item }: TripChecklistItemProps) {
  const addChecklistSubItem = useSetAtom(addChecklistSubItemAtom);
  const updateChecklistTitle = useSetAtom(updateChecklistTitleAtom);
  const updateChecklistSubItem = useSetAtom(updateChecklistSubItemAtom);
  const removeChecklistSubItem = useSetAtom(removeChecklistSubItemAtom);
  const removeItemFromBlock = useSetAtom(removeItemFromBlockAtom);
  const readOnly = useAtomValue(plannerReadOnlyAtom);

  if (readOnly) {
    return (
      <article className="rounded-sm border border-border bg-card p-4 shadow-xs">
        <h4 className="px-1 py-1 text-base font-bold text-foreground">{item.title || "Checklist"}</h4>
        <ul className="mt-2 space-y-2">
          {item.items.map((subItem) => (
            <li key={subItem.id} className="flex items-center gap-2 px-1 text-sm text-foreground">
              <Square className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              {subItem.label}
            </li>
          ))}
        </ul>
      </article>
    );
  }

  return (
    <article className="rounded-sm border border-border bg-card p-4 shadow-xs">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 space-y-3">
          <input
            type="text"
            value={item.title}
            onChange={(event) =>
              updateChecklistTitle({
                blockId,
                itemId: item.id,
                title: event.target.value,
              })
            }
            aria-label="Checklist title"
            placeholder="Add title"
            className="w-full rounded-sm border border-transparent bg-transparent px-1 py-1 text-base font-bold text-foreground placeholder:text-muted-foreground hover:border-border focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
          />

          <div className="space-y-2">
            {item.items.length ? (
              item.items.map((subItem) => (
                <div key={subItem.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={subItem.checked}
                    onCheckedChange={(checked) =>
                      updateChecklistSubItem({
                        blockId,
                        itemId: item.id,
                        subItemId: subItem.id,
                        updates: { checked: checked === true },
                      })
                    }
                    aria-label={
                      subItem.label
                        ? `Mark ${subItem.label}`
                        : "Mark checklist item"
                    }
                  />
                  <input
                    type="text"
                    value={subItem.label}
                    onChange={(event) =>
                      updateChecklistSubItem({
                        blockId,
                        itemId: item.id,
                        subItemId: subItem.id,
                        updates: { label: event.target.value },
                      })
                    }
                    aria-label="Checklist item"
                    placeholder="Add some items"
                    className="min-w-0 flex-1 rounded-sm border border-transparent bg-transparent px-1 py-1 text-sm text-foreground placeholder:text-muted-foreground hover:border-border focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Delete checklist item"
                    onClick={() =>
                      removeChecklistSubItem({
                        blockId,
                        itemId: item.id,
                        subItemId: subItem.id,
                      })
                    }
                  >
                    <X className="size-3" aria-hidden="true" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="rounded-sm bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                Add checklist items to start tracking this list.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-sm"
                onClick={() => addChecklistSubItem({ blockId, itemId: item.id })}
              >
                <Plus className="size-4" aria-hidden="true" />
                Add item
              </Button>
              <PremadeListPicker blockId={blockId} itemId={item.id} />
            </div>

            <Button
              type="button"
              variant="destructive"
              size="icon-sm"
              aria-label="Delete checklist"
              onClick={() => removeItemFromBlock({ blockId, itemId: item.id })}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

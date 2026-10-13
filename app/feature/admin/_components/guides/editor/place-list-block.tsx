"use client";

import { useEffect } from "react";
import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { useSetAtom } from "jotai";
import { Check, ChevronDown, MapPinned } from "lucide-react";

import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { CategoryIcon } from "../category-icon";
import { categoryForNewList, ensureList, findCategory, setListCategory, type GuideList } from "../guide-model";
import { activeGuideListAtom, focusListSearchAtom } from "../guides.atoms";
import { useGuideEditor } from "./guide-editor-context";
import { PlaceListSearch } from "./place-list-search";

/**
 * A list header in the guide's text. The place cards after it, up to the next
 * header, are its places; text between them is ordinary writing.
 */
export function PlaceListNodeView({ node, selected }: ReactNodeViewProps) {
  const listId = typeof node.attrs.listId === "string" ? node.attrs.listId : null;
  return (
    <NodeViewWrapper>
      {listId ? (
        <PlaceListHeader listId={listId} blockSelected={selected} />
      ) : (
        <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          This list lost its settings. Delete the block and add a new place list.
        </p>
      )}
    </NodeViewWrapper>
  );
}

function PlaceListHeader({ listId, blockSelected }: { listId: string; blockSelected: boolean }) {
  const { guide, updateGuide } = useGuideEditor("PlaceListHeader");
  const setFocusListId = useSetAtom(focusListSearchAtom);
  const list = guide.lists[listId];
  const fallbackCategoryId = categoryForNewList(guide)?.id ?? null;

  useEffect(() => {
    // A block inserted from the slash menu has an id but no settings yet.
    if (list || !fallbackCategoryId) return;
    updateGuide((current) => ensureList(current, listId, fallbackCategoryId));
    setFocusListId(listId);
  }, [fallbackCategoryId, list, listId, setFocusListId, updateGuide]);

  if (!list) {
    return fallbackCategoryId ? null : (
      <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">Add a category above, then this list can use it.</p>
    );
  }

  const category = findCategory(guide, list.categoryId);
  return (
    <section
      aria-label={category?.name ?? "Place list"}
      className={cn("flex flex-col gap-3 rounded-xl bg-muted/50 p-3 sm:p-4", blockSelected && "ring-2 ring-primary/40")}
    >
      <HeaderTitle list={list} />
      <PlaceListSearch listId={list.id} categoryName={category?.name ?? "this list"} />
    </section>
  );
}

function HeaderTitle({ list }: { list: GuideList }) {
  const { guide, sections, updateGuide } = useGuideEditor("PlaceListHeaderTitle");
  const setActiveList = useSetAtom(activeGuideListAtom);
  const category = findCategory(guide, list.categoryId);
  const count = sections.find((section) => section.listId === list.id)?.places.length ?? 0;

  return (
    <div className="flex items-center gap-3">
      {category ? <CategoryIcon category={category} size="lg" /> : <MapPinned aria-hidden="true" className="size-6 text-muted-foreground" />}
      <div className="flex min-w-0 flex-1 flex-col">
        <DropdownMenu>
          <h3 className="flex min-w-0">
            <DropdownMenuTrigger
              onClick={() => setActiveList(list.id)}
              className="-ml-1.5 flex max-w-full items-center gap-1 rounded-md px-1.5 text-left text-xl leading-7 font-bold tracking-tight hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="truncate">{category?.name ?? "Choose a category"}</span>
              <span className="sr-only">, change category</span>
              <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            </DropdownMenuTrigger>
          </h3>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Category</DropdownMenuLabel>
              {guide.categories.map((option) => (
                <DropdownMenuItem key={option.id} onClick={() => updateGuide((current) => setListCategory(current, list.id, option.id))}>
                  <CategoryIcon category={option} size="sm" />
                  <span className="flex-1 truncate">{option.name}</span>
                  {option.id === list.categoryId ? <Check aria-label="Current category" /> : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <p className="text-xs text-muted-foreground">
          {count ? (
            <>
              <span className="font-mono tabular-nums text-foreground">{count}</span> {count === 1 ? "place" : "places"} below, pinned on the map
            </>
          ) : (
            "No places yet. Find one here, or click a place on the map."
          )}
        </p>
      </div>
    </div>
  );
}

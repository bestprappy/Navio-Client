"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { CategoryIcon } from "../category-icon";
import { categoryUseCount, removeCategory, upsertCategory, type GuideCategory } from "../guide-model";
import { CategoryForm } from "./category-form";
import { useGuideEditor } from "./guide-editor-context";

function createCategoryId(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32);
  const suffix = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 6) : Math.random().toString(36).slice(2, 8);
  return `${slug || "category"}-${suffix}`;
}

const CHIP = "flex h-8 items-center gap-2 rounded-full pr-3 pl-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

/** The guide's categories. Each chip edits its category; the last one adds a new one. */
export function CategoryBar() {
  const { guide } = useGuideEditor("CategoryBar");
  return (
    <div role="group" aria-label="Categories" className="flex flex-wrap items-center gap-2">
      {guide.categories.map((category) => (
        <CategoryChip key={category.id} category={category} />
      ))}
      <AddCategoryButton />
    </div>
  );
}

function CategoryChip({ category }: { category: GuideCategory }) {
  const { guide, updateGuide } = useGuideEditor("CategoryChip");
  const [open, setOpen] = useState(false);
  const useCount = categoryUseCount(guide, category.id);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={cn(CHIP, "bg-muted hover:bg-secondary aria-expanded:bg-secondary")} aria-label={`${category.name}, ${useCount} ${useCount === 1 ? "list" : "lists"}. Edit category`}>
        <CategoryIcon category={category} size="sm" className="rounded-full" />
        {category.name}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-4">
        <CategoryForm
          initial={category}
          useCount={useCount}
          onCancel={() => setOpen(false)}
          onSubmit={(values) => {
            updateGuide((current) => upsertCategory(current, { ...values, id: category.id }));
            setOpen(false);
          }}
          onDelete={() => {
            updateGuide((current) => removeCategory(current, category.id));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function AddCategoryButton() {
  const { updateGuide } = useGuideEditor("AddCategoryButton");
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={cn(CHIP, "border border-dashed border-input pl-2.5 text-muted-foreground hover:border-solid hover:text-foreground aria-expanded:border-solid")}>
        <Plus aria-hidden="true" className="size-4" />
        Add category
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-4">
        <CategoryForm
          initial={null}
          useCount={0}
          onCancel={() => setOpen(false)}
          onSubmit={(values) => {
            updateGuide((current) => upsertCategory(current, { ...values, id: createCategoryId(values.name) }));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

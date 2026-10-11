import { cn } from "@/lib/utils";

import { getPlaceTagCategory } from "./place-tag-category";

type PlaceTypeTagProps = {
  label: string;
  placeType?: string;
  className?: string;
};

export function PlaceTypeTag({ label, placeType, className }: PlaceTypeTagProps) {
  return (
    <span
      className={cn(
        "place-type-tag inline-flex max-w-full items-center rounded-sm px-3 py-1 text-xs font-medium wrap-anywhere",
        className,
      )}
      data-place-category={getPlaceTagCategory(placeType, label)}
    >
      {label}
    </span>
  );
}

import { cn } from "@/lib/utils";

import { getPlaceTagCategory } from "./place-tag-category";
import { PLACE_TAG_ICONS } from "./place-tag-icon";

type PlaceTypeTagProps = {
  label: string;
  placeType?: string;
  /** Leads the label with the category's icon, for dense lists where the tag is scanned. */
  withIcon?: boolean;
  className?: string;
};

export function PlaceTypeTag({ label, placeType, withIcon = false, className }: PlaceTypeTagProps) {
  const category = getPlaceTagCategory(placeType, label);
  const Icon = PLACE_TAG_ICONS[category];
  return (
    <span
      className={cn(
        "place-type-tag inline-flex max-w-full items-center rounded-sm px-3 py-1 text-xs font-medium wrap-anywhere",
        className,
      )}
      data-place-category={category}
    >
      {withIcon ? (
        <>
          <Icon className="mr-1.5 size-3.5 shrink-0" aria-hidden="true" />
          <span className="min-w-0">{label}</span>
        </>
      ) : label}
    </span>
  );
}

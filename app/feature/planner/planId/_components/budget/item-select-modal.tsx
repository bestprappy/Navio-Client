"use client";

import type { ReactNode } from "react";
import { ArrowLeft, BadgeDollarSign, CircleEllipsis } from "lucide-react";

import { expenseCategories } from "./budget.data";
import { BudgetModalShell } from "./budget-modal-shell";
import type { ExpenseCategory } from "./budget.types";

type TripPlaceOption = { id: string; name: string };

type ItemSelectModalProps = {
  recentTripPlaces: TripPlaceOption[];
  showAllTripItems: boolean;
  hasTripOverflow: boolean;
  onSelectTripPlace: (name: string) => void;
  onSelectCategory: (category: ExpenseCategory) => void;
  onToggleShowAll: () => void;
  onClose: () => void;
  onBack: () => void;
};

export function ItemSelectModal({
  recentTripPlaces,
  showAllTripItems,
  hasTripOverflow,
  onSelectTripPlace,
  onSelectCategory,
  onToggleShowAll,
  onClose,
  onBack,
}: ItemSelectModalProps) {
  return (
    <BudgetModalShell
      title="Select item"
      onClose={onClose}
      leadingAction={
        <button
          type="button"
          className="flex size-8 items-center justify-center rounded-full text-foreground hover:bg-muted"
          onClick={onBack}
          aria-label="Back to add expense"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </button>
      }
    >
      <div className="space-y-6">
        <div>
          <p className="mb-2 text-sm font-bold text-foreground">
            Select from your trip plan
          </p>
          <div className="space-y-1">
            {recentTripPlaces.length > 0 ? (
              recentTripPlaces.map((place) => (
                <SelectItemButton
                  key={place.id}
                  icon={<BadgeDollarSign className="size-4" aria-hidden="true" />}
                  label={place.name}
                  onClick={() => onSelectTripPlace(place.name)}
                />
              ))
            ) : (
              <p className="rounded-sm bg-muted px-3 py-3 text-sm text-muted-foreground">
                Add places to your plan to choose them here.
              </p>
            )}
            {hasTripOverflow && (
              <SelectItemButton
                icon={<CircleEllipsis className="size-4" aria-hidden="true" />}
                label={showAllTripItems ? "Show less" : "See all"}
                onClick={onToggleShowAll}
              />
            )}
          </div>
        </div>

        <div className="border-t border-border pt-5">
          <p className="mb-3 text-sm font-bold text-foreground">
            Or select from a category
          </p>
          <div className="grid grid-cols-4 gap-2">
            {expenseCategories.map((category) => {
              const Icon = category.Icon;
              return (
                <button
                  key={category.id}
                  type="button"
                  className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-sm bg-muted px-2 py-2 text-center text-xs font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  onClick={() => onSelectCategory(category)}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  <span>{category.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </BudgetModalShell>
  );
}

function SelectItemButton({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-sm px-1 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
      onClick={onClick}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </span>
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}

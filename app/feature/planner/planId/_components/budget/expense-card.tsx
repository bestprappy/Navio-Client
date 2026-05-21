"use client";

import { X } from "lucide-react";

import { formatMoney } from "./budget.utils";
import type { CurrencyCode, ExpenseItem } from "./budget.types";

type ExpenseCardProps = {
  expense: ExpenseItem;
  currencyCode: CurrencyCode;
  onEdit: (expense: ExpenseItem) => void;
  onDelete: (id: string) => void;
};

export function ExpenseCard({ expense, currencyCode, onEdit, onDelete }: ExpenseCardProps) {
  const Icon = expense.Icon;

  return (
    <div className="flex items-center rounded-sm border border-border bg-card">
      <button
        type="button"
        className="grid flex-1 grid-cols-[2rem_1fr_auto] items-center gap-3 p-3 text-left transition-colors hover:bg-muted/50"
        onClick={() => onEdit(expense)}
        aria-label={`Edit ${expense.label}`}
      >
        <div className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="size-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{expense.label}</p>
          <p className="text-xs text-muted-foreground">
            {expense.categoryLabel}
            {expense.date ? ` - ${expense.date}` : ""}
          </p>
        </div>
        <p className="text-sm font-bold text-foreground">
          {formatMoney(expense.amount, currencyCode)}
        </p>
      </button>
      <button
        type="button"
        className="flex shrink-0 items-center justify-center px-3 py-3 text-muted-foreground transition-colors hover:text-destructive"
        onClick={() => onDelete(expense.id)}
        aria-label={`Delete ${expense.label}`}
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

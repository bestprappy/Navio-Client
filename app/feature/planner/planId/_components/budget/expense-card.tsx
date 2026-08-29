"use client";

import { X } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";

import { getExpenseCategory } from "./budget.data";
import { formatMoney } from "./budget.utils";
import type { CurrencyCode, ExpenseItem } from "./budget.types";

type ExpenseCardProps = {
  expense: ExpenseItem;
  currencyCode: CurrencyCode;
  onEdit: (expense: ExpenseItem) => void;
  onDelete: (id: string) => void;
};

export function ExpenseCard({ expense, currencyCode, onEdit, onDelete }: ExpenseCardProps) {
  const category = getExpenseCategory(expense.categoryId);
  const Icon = category.Icon;
  const displayDate = formatExpenseDate(expense.date);

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
            {category.label}
            {displayDate ? ` · ${displayDate}` : ""}
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

function formatExpenseDate(value: string | undefined): string | null {
  if (!value) return null;
  const date = parseISO(value);
  return isValid(date) ? format(date, "MMM d, yyyy") : null;
}

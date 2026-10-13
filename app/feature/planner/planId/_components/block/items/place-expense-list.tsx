"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { X } from "lucide-react";

import { getExpenseCategory } from "../../budget/budget.data";
import { formatMoney } from "../../budget/budget.utils";
import { getPlaceExpenses, getPlaceExpenseTotal, legacyPlaceExpenseId } from "../../budget/place-expenses";
import {
  removePlaceExpenseAtom,
  tripCurrencyAtom,
  tripExpensesAtom,
} from "../../overview/trip-builder.atoms";
import { PlaceCostPopover } from "./place-cost-popover";

type PlaceExpenseListProps = {
  blockId: string;
  itemId: string;
  itemName: string;
  blockDate: string;
  cost?: number;
  readOnly: boolean;
  editable: boolean;
};

export function PlaceExpenseList({ blockId, itemId, itemName, blockDate, cost, readOnly, editable }: PlaceExpenseListProps) {
  const expenses = useAtomValue(tripExpensesAtom);
  const currency = useAtomValue(tripCurrencyAtom);
  const removeExpense = useSetAtom(removePlaceExpenseAtom);
  const linked = getPlaceExpenses(expenses, itemId);
  // Older/template snapshots can carry a cost without a matching budget entry.
  const entries = linked.length ? linked : cost !== undefined && cost > 0 && !readOnly
    ? [{ id: legacyPlaceExpenseId(itemId), amount: cost, label: itemName, categoryId: "sightseeing", date: blockDate }]
    : [];
  const total = entries.length ? getPlaceExpenseTotal(entries, currency.code) : cost;
  const canEdit = editable && !readOnly;
  if (!canEdit && !entries.length && total === undefined) return null;
  const sharedProps = { blockId, itemId, itemName, blockDate };

  return (
    <section
      className="border-t border-border/70 px-4 py-3"
      aria-label={`Expenses for ${itemName}`}
      onClick={(event) => { if (canEdit) event.stopPropagation(); }}
      data-no-drag
    >
      {(entries.length > 0 || canEdit) && (
        <div className="flex items-center justify-between gap-2">
          {entries.length > 0 && <h4 className="text-xs font-semibold text-muted-foreground">Expenses</h4>}
          {canEdit && <PlaceCostPopover {...sharedProps} />}
        </div>
      )}
      {entries.length > 0 && (
        <ul className="mt-1 divide-y divide-border/50" aria-label="Expense entries">
          {entries.map((expense) => {
            const category = getExpenseCategory(expense.categoryId);
            const Icon = category.Icon;
            const summary = (
              <>
                <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{expense.label}</span>
                  <span className="block text-xs text-muted-foreground">{category.label}</span>
                </span>
                <span className="shrink-0 text-sm font-medium tabular-nums text-foreground">{formatMoney(expense.amount, currency.code)}</span>
              </>
            );
            return (
              <li key={expense.id} className="flex min-w-0 items-center gap-1">
                {!canEdit ? (
                  <div className="flex min-h-12 min-w-0 flex-1 items-center gap-3 py-2">{summary}</div>
                ) : (
                  <>
                    <PlaceCostPopover {...sharedProps} expense={expense} className="-ml-1 flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-sm px-1 py-2 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                      {summary}
                    </PlaceCostPopover>
                    <button
                      type="button"
                      className="flex size-8 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      aria-label={`Delete expense: ${expense.label}`}
                      onClick={() => removeExpense({ blockId, itemId, expenseId: expense.id })}
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {total !== undefined && (
        <div className={`flex items-center justify-between gap-3 text-sm${entries.length > 0 || canEdit ? " mt-2 border-t border-border/70 pt-2" : ""}`} aria-label="Place expense total">
          <span className="font-medium text-muted-foreground">Total</span>
          <span className="font-semibold tabular-nums text-foreground">{formatMoney(total, currency.code)}</span>
        </div>
      )}
    </section>
  );
}

"use client";

import { BudgetModalShell } from "./budget-modal-shell";
import { formatMoney } from "./budget.utils";
import type { CurrencyCode, ExpenseCategory } from "./budget.types";

type BreakdownCategory = ExpenseCategory & { amount: number };

type BreakdownModalProps = {
  breakdown: BreakdownCategory[];
  currencyCode: CurrencyCode;
  totalSpent: number;
  onClose: () => void;
};

export function BreakdownModal({
  breakdown,
  currencyCode,
  totalSpent,
  onClose,
}: BreakdownModalProps) {
  return (
    <BudgetModalShell title="Expense breakdown" onClose={onClose}>
      <div className="space-y-3">
        {breakdown.length > 0 ? (
          breakdown.map((category) => {
            const Icon = category.Icon;
            const categoryProgress =
              totalSpent > 0 ? (category.amount / totalSpent) * 100 : 0;

            return (
              <div key={category.id} className="rounded-sm border border-border p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <Icon
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <p className="truncate text-sm font-semibold text-foreground">
                      {category.label}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-foreground">
                    {formatMoney(category.amount, currencyCode)}
                  </p>
                </div>
                <div className="h-1.5 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${categoryProgress}%` }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <p className="rounded-sm bg-muted px-3 py-4 text-sm text-muted-foreground">
            Add an expense to see a category breakdown.
          </p>
        )}
      </div>
    </BudgetModalShell>
  );
}

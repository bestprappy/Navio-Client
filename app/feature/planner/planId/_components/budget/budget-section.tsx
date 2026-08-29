"use client";

import type { ReactNode } from "react";
import {
  Coins,
  Info,
  ListChecks,
  Pencil,
  Plus,
  Settings,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useBudget } from "./use-budget";
import { formatMoney } from "./budget.utils";
import { ExpenseCard } from "./expense-card";
import { ExpenseModal } from "./expense-modal";
import { ItemSelectModal } from "./item-select-modal";
import { BudgetEditModal } from "./budget-edit-modal";
import { BudgetSettingsModal } from "./budget-settings-modal";
import { BreakdownModal } from "./breakdown-modal";

export function BudgetSection() {
  const b = useBudget();

  return (
    <section className="px-4 pb-12 pt-2">
      <div className="mb-5 flex items-center justify-between pl-4">
        <h2 className="text-2xl font-bold text-foreground">Budgeting</h2>
        <Button
          type="button"
          size="lg"
          className="mr-4 gap-2 rounded-full px-6"
          onClick={() => b.openExpenseModal()}
        >
          <Plus className="size-4" aria-hidden="true" />
          Add expense
        </Button>
      </div>

      <div className="mx-2 rounded-sm bg-card border p-5">
        <div className="grid gap-5 lg:grid-cols-[1fr_12rem]">
          <div>
            <div className="flex items-end justify-between gap-4">
              <p className="text-3xl font-semibold text-foreground">
                {formatMoney(b.totalSpent, b.currency.code)}
              </p>
              {b.budget > 0 && (
                <p className="pb-1 text-xs font-medium text-muted-foreground">
                  Budget: {formatMoney(b.budget, b.currency.code)}
                </p>
              )}
            </div>
            {b.budget > 0 && (
              <div
                className="mt-2 h-1.5 rounded-full bg-muted-foreground/25"
                role="progressbar"
                aria-label={`${Math.round(b.progress)} percent of budget spent`}
                aria-valuenow={Math.round(b.progress)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    b.progress >= 100 ? "bg-destructive" : "bg-primary",
                  )}
                  style={{ width: `${b.progress}%` }}
                />
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="rounded-full px-5"
                onClick={b.openBudgetModal}
              >
                <Pencil className="size-4" aria-hidden="true" />
                Edit budget
              </Button>
              {b.budget > 0 && (
                <div className="flex items-center gap-2 rounded-full bg-background px-4 py-2 text-sm font-semibold text-foreground">
                  <Coins
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  Remaining {formatMoney(b.remaining, b.currency.code)}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <BudgetSideAction
              icon={<ListChecks className="size-4" aria-hidden="true" />}
              label="View breakdown"
              onClick={() => b.setActiveModal("breakdown")}
            />
            <BudgetSideAction
              icon={<Settings className="size-4" aria-hidden="true" />}
              label="Settings"
              onClick={() => b.setActiveModal("settings")}
            />
          </div>
        </div>
      </div>

      <div className="mx-3 mt-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-lg font-semibold text-foreground">Expenses</p>
          {/* //TODO Add sorting in the future */}
        </div>
        {b.expenses.length === 0 ? (
          <div className="flex items-center gap-3 rounded-sm border border-primary/30 bg-primary/5 p-4">
            <Info className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-sm font-medium text-primary">
              Tap <strong>Add expense</strong> to start tracking.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {b.expenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                currencyCode={b.currency.code}
                onEdit={b.openExpenseModal}
                onDelete={b.deleteExpense}
              />
            ))}
          </div>
        )}
      </div>

      {b.activeModal === "expense" && (
        <ExpenseModal
          mode={b.editingExpenseId ? "edit" : "add"}
          currencySymbol={b.currency.symbol}
          expenseAmount={b.expenseAmount}
          expenseDate={b.expenseDate}
          expenseName={b.expenseName}
          selectedLabel={b.selectedLabel}
          onAmountChange={b.setExpenseAmount}
          onDateChange={b.setExpenseDate}
          onNameChange={b.setExpenseName}
          onSubmit={b.saveExpense}
          onClose={b.closeModal}
          onOpenItemSelect={() => b.setActiveModal("item")}
        />
      )}

      {b.activeModal === "item" && (
        <ItemSelectModal
          recentTripPlaces={b.recentTripPlaces}
          showAllTripItems={b.showAllTripItems}
          hasTripOverflow={b.tripPlaces.length > 3}
          onSelectTripPlace={b.selectTripPlaceItem}
          onSelectCategory={b.selectCategory}
          onToggleShowAll={b.toggleShowAllTripItems}
          onClose={b.closeModal}
          onBack={() => b.setActiveModal("expense")}
        />
      )}

      {b.activeModal === "budget" && (
        <BudgetEditModal
          currencySymbol={b.currency.symbol}
          draftBudget={b.draftBudget}
          onDraftChange={b.setDraftBudget}
          onSubmit={b.saveBudget}
          onClose={b.closeModal}
        />
      )}

      {b.activeModal === "settings" && (
        <BudgetSettingsModal
          currency={b.currency}
          onCurrencyChange={b.changeCurrency}
          isConverting={b.isConvertingCurrency}
          conversionError={b.currencyConversionError}
          onClose={b.closeModal}
        />
      )}

      {b.activeModal === "breakdown" && (
        <BreakdownModal
          breakdown={b.breakdown}
          currencyCode={b.currency.code}
          totalSpent={b.totalSpent}
          onClose={b.closeModal}
        />
      )}
    </section>
  );
}

function BudgetSideAction({
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
      className="flex items-center gap-3 rounded-sm px-3 py-2 text-left text-sm font-semibold text-foreground transition-colors hover:bg-background"
      onClick={onClick}
    >
      <span className="text-muted-foreground">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

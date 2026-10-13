"use client";

import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { format, parseISO } from "date-fns";
import { CalendarDays, ChevronDown, PencilLine, Plus } from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";

import { Button } from "@/components/ui/button";

import { BudgetModalShell } from "../../budget/budget-modal-shell";
import { ExpenseCategorySelect } from "../../budget/expense-category-select";
import { getExpenseCategory } from "../../budget/budget.data";
import type { ExpenseItem } from "../../budget/budget.types";
import { roundMoney } from "../../budget/budget.utils";
import {
  savePlaceExpenseAtom,
  tripCurrencyAtom,
} from "../../overview/trip-builder.atoms";

type PlaceCostPopoverProps = {
  blockId: string;
  itemId: string;
  itemName: string;
  blockDate: string;
  expense?: ExpenseItem;
  children?: ReactNode;
  className?: string;
};

export function PlaceCostPopover({
  blockId,
  itemId,
  itemName,
  blockDate,
  expense,
  children,
  className,
}: PlaceCostPopoverProps) {
  const saveExpense = useSetAtom(savePlaceExpenseAtom);
  const currency = useAtomValue(tripCurrencyAtom);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftName, setDraftName] = useState("");
  const [draftCategoryId, setDraftCategoryId] = useState("sightseeing");
  const [error, setError] = useState<string | null>(null);

  const isEdit = expense !== undefined;

  const expenseDate = expense?.date ?? blockDate;
  const blockDateParsed = useMemo(() => parseISO(expenseDate), [expenseDate]);
  const blockDateFormatted = format(blockDateParsed, "MMM d, yyyy");

  function handleOpen(event: React.MouseEvent) {
    event.stopPropagation();
    setDraft(expense ? String(expense.amount) : "");
    setDraftName(expense?.label ?? itemName);
    setDraftCategoryId(getExpenseCategory(expense?.categoryId ?? "sightseeing").id);
    setError(null);
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = roundMoney(Number(draft), currency.code);
    if (!Number.isFinite(amount) || amount <= 0) return;

    const label = draftName.trim() || itemName;

    const saved = saveExpense({ blockId, itemId, expenseId: expense?.id, amount, label, categoryId: draftCategoryId });
    if (!saved) {
      setError("This stop or expense has changed. Close this form and try again.");
      return;
    }
    handleClose();
  }

  return (
    <>
      <button
        type="button"
        className={className ?? "inline-flex min-h-8 items-center gap-1.5 rounded-sm px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"}
        onClick={handleOpen}
        aria-label={expense ? `Edit expense: ${expense.label}` : `Add expense to ${itemName}`}
        data-no-drag
      >
        {children ?? <><Plus className="size-3.5" aria-hidden="true" />Add expense</>}
      </button>

      {open
        ? createPortal(
            <BudgetModalShell
              title={isEdit ? "Edit expense" : "Add expense"}
              onClose={handleClose}
            >
              <form className="space-y-3" onSubmit={handleSubmit}>
                {/* Amount */}
                <label className="flex h-14 items-center gap-2 rounded-sm border border-ring/40 bg-background px-4 text-lg shadow-[0_0_0_3px] shadow-ring/20">
                  <span className="font-semibold text-foreground">
                    {currency.symbol}
                  </span>
                  <ChevronDown
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <input
                    type="number"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-base font-medium text-foreground outline-none placeholder:text-muted-foreground"
                    inputMode="decimal"
                    min="0.01"
                    max="999999999999.99"
                    step="any"
                    required
                    placeholder="0"
                    aria-label="Expense amount"
                    autoFocus
                  />
                </label>

                {/* Expense name */}
                <label className="flex h-13 items-center gap-3 rounded-sm border border-border bg-background px-4">
                  <PencilLine
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <input
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground"
                    placeholder="Expense name (optional)"
                    maxLength={255}
                    aria-label="Expense name"
                  />
                </label>

                <ExpenseCategorySelect
                  value={draftCategoryId}
                  onValueChange={setDraftCategoryId}
                />

                {/* Date — auto from itinerary block, read-only */}
                <div className="flex h-13 w-full items-center gap-3 rounded-sm border border-border bg-muted/40 px-4">
                  <CalendarDays
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="text-sm font-semibold text-foreground">
                    Date:
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {blockDateFormatted}
                  </span>
                </div>

                {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

                <div className="flex justify-center pt-5">
                  <Button type="submit" size="lg" className="rounded-full px-10">
                    Save
                  </Button>
                </div>
              </form>
            </BudgetModalShell>,
            document.body,
          )
        : null}
    </>
  );
}

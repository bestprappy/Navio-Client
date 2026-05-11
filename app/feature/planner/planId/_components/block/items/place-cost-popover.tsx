"use client";

import { type FormEvent, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { format, parseISO } from "date-fns";
import { CalendarDays, ChevronDown, Landmark, PencilLine } from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";

import { Button } from "@/components/ui/button";

import { BudgetModalShell } from "../../budget/budget-modal-shell";
import {
  tripCurrencyAtom,
  tripExpensesAtom,
  updatePlaceItemAtom,
} from "../../overview/trip-builder.atoms";

type PlaceCostPopoverProps = {
  blockId: string;
  itemId: string;
  itemName: string;
  blockDate: string;
  cost?: number;
};

export function PlaceCostPopover({
  blockId,
  itemId,
  itemName,
  blockDate,
  cost,
}: PlaceCostPopoverProps) {
  const updatePlaceItem = useSetAtom(updatePlaceItemAtom);
  const setExpenses = useSetAtom(tripExpensesAtom);
  const currency = useAtomValue(tripCurrencyAtom);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftName, setDraftName] = useState("");

  const expenseId = `place-cost-${itemId}`;
  const isEdit = cost !== undefined;

  const blockDateParsed = useMemo(() => parseISO(blockDate), [blockDate]);
  const blockDateFormatted = format(blockDateParsed, "MMM d, yyyy");

  function handleOpen(event: React.MouseEvent) {
    event.stopPropagation();
    setDraft(cost !== undefined ? String(cost) : "");
    setDraftName(itemName);
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(draft);
    if (!Number.isFinite(amount) || amount <= 0) return;

    const label = draftName.trim() || itemName;

    updatePlaceItem({ blockId, itemId, updates: { cost: amount } });
    setExpenses((prev) => {
      const entry = {
        id: expenseId,
        amount,
        label,
        categoryId: "sightseeing",
        categoryLabel: "Sightseeing",
        Icon: Landmark,
        date: blockDateFormatted,
        rawDate: blockDateParsed,
      };
      return prev.some((e) => e.id === expenseId)
        ? prev.map((e) => (e.id === expenseId ? { ...e, ...entry } : e))
        : [entry, ...prev];
    });
    handleClose();
  }

  return (
    <>
      <button
        type="button"
        className={
          isEdit
            ? "inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-muted px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted/80"
            : "inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-background px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
        }
        onClick={handleOpen}
      >
        {isEdit ? `${currency.symbol} ${cost.toLocaleString()}` : "Add cost"}
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
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-base font-medium text-foreground outline-none placeholder:text-muted-foreground"
                    inputMode="decimal"
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
                    aria-label="Expense name"
                  />
                </label>

                {/* Category — fixed to Sightseeing for place costs */}
                <div className="flex h-13 w-full items-center gap-3 rounded-sm border border-border bg-background px-4">
                  <Landmark
                    className="size-4 shrink-0 text-foreground"
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium text-muted-foreground">
                    Sightseeing
                  </span>
                </div>

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

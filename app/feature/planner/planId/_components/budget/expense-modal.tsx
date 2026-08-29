"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { format } from "date-fns";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  PencilLine,
  ReceiptText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { BudgetModalShell } from "./budget-modal-shell";

type ExpenseModalProps = {
  mode: "add" | "edit";
  currencySymbol: string;
  expenseAmount: string;
  expenseDate: Date | undefined;
  expenseName: string;
  selectedLabel: string;
  onAmountChange: (value: string) => void;
  onDateChange: (value: Date | undefined) => void;
  onNameChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  onOpenItemSelect: () => void;
};

export function ExpenseModal({
  mode,
  currencySymbol,
  expenseAmount,
  expenseDate,
  expenseName,
  selectedLabel,
  onAmountChange,
  onDateChange,
  onNameChange,
  onSubmit,
  onClose,
  onOpenItemSelect,
}: ExpenseModalProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  return (
    <BudgetModalShell title={mode === "edit" ? "Edit expense" : "Add expense"} onClose={onClose}>
      <form className="space-y-3" onSubmit={onSubmit}>
        {/* Amount */}
        <label className="flex h-14 items-center gap-2 rounded-sm border border-ring/40 bg-background px-4 text-lg shadow-[0_0_0_3px] shadow-ring/20">
          <span className="font-semibold text-foreground">{currencySymbol}</span>
          <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
          <input
            type="number"
            value={expenseAmount}
            onChange={(e) => onAmountChange(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-base font-medium text-foreground outline-none placeholder:text-muted-foreground"
            inputMode="decimal"
            min="0.01"
            max="999999999999.99"
            step="any"
            required
            placeholder="0"
            aria-label="Expense amount"
          />
        </label>

        {/* Expense name */}
        <label className="flex h-13 items-center gap-3 rounded-sm border border-border bg-background px-4">
          <PencilLine className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            value={expenseName}
            onChange={(e) => onNameChange(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground"
            placeholder="Expense name (optional)"
            maxLength={255}
            aria-label="Expense name"
          />
        </label>

        {/* Category / item */}
        <button
          type="button"
          className="flex h-13 w-full items-center justify-between rounded-sm border border-border bg-background px-4 text-left transition-colors hover:bg-muted"
          onClick={onOpenItemSelect}
        >
          <span className="flex min-w-0 items-center gap-3">
            <ReceiptText className="size-4 shrink-0 text-foreground" aria-hidden="true" />
            <span className="truncate text-sm font-medium text-muted-foreground">
              {selectedLabel}
            </span>
          </span>
          <ChevronRight className="size-5 text-foreground" aria-hidden="true" />
        </button>

        {/* Date — shadcn Calendar in Popover */}
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger
            render={
              <button
                type="button"
                className="flex h-13 w-full items-center gap-3 rounded-sm border border-border bg-background px-4 text-left transition-colors hover:bg-muted"
                aria-label="Pick expense date"
              />
            }
          >
            <CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm font-semibold text-foreground">Date:</span>
            <span className="text-sm text-muted-foreground">
              {expenseDate ? format(expenseDate, "MMM d, yyyy") : "Pick a date"}
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" side="bottom" align="start">
            <Calendar
              mode="single"
              selected={expenseDate}
              onSelect={(day) => {
                onDateChange(day);
                setCalendarOpen(false);
              }}
              captionLayout="dropdown"
            />
          </PopoverContent>
        </Popover>

        <div className="flex justify-center pt-5">
          <Button type="submit" size="lg" className="rounded-full px-10">
            Save
          </Button>
        </div>
      </form>
    </BudgetModalShell>
  );
}

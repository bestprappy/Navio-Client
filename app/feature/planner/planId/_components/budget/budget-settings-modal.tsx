"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { currencyOptions } from "./budget.data";
import { BudgetModalShell } from "./budget-modal-shell";
import type { CurrencyOption } from "./budget.types";

type BudgetSettingsModalProps = {
  currency: CurrencyOption;
  onCurrencyChange: (option: CurrencyOption) => void;
  onClose: () => void;
};

export function BudgetSettingsModal({
  currency,
  onCurrencyChange,
  onClose,
}: BudgetSettingsModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <BudgetModalShell title="Expense settings" onClose={onClose}>
      <div className="space-y-8">
        <div>
          <p className="mb-3 text-sm font-bold text-foreground">Default currency</p>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
              render={
                <button
                  type="button"
                  className="grid w-full grid-cols-[2.75rem_1fr_auto] items-center rounded-sm border border-border bg-background px-4 py-3"
                  aria-label="Select currency"
                />
              }
            >
              <span className="text-base font-semibold text-foreground">
                {currency.symbol}
              </span>
              <span className="text-sm font-semibold text-foreground">
                {currency.label} ({currency.code})
              </span>
              <ChevronDown className="size-4 text-foreground" aria-hidden="true" />
            </PopoverTrigger>
            <PopoverContent
              className="w-(--anchor-width) min-w-48 p-1"
              side="bottom"
              align="start"
            >
              {currencyOptions.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                    option.code === currency.code && "font-semibold text-foreground",
                  )}
                  onClick={() => {
                    onCurrencyChange(option);
                    setOpen(false);
                  }}
                >
                  <span className="w-8 shrink-0 text-base font-semibold text-foreground">
                    {option.symbol}
                  </span>
                  <span className="flex-1">
                    {option.label} ({option.code})
                  </span>
                  {option.code === currency.code && (
                    <Check className="size-4 text-primary" aria-hidden="true" />
                  )}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </BudgetModalShell>
  );
}

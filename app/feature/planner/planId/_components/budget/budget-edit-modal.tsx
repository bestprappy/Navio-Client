"use client";

import type { FormEvent } from "react";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";

import { BudgetModalShell } from "./budget-modal-shell";

type BudgetEditModalProps = {
  currencySymbol: string;
  draftBudget: string;
  onDraftChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
};

export function BudgetEditModal({
  currencySymbol,
  draftBudget,
  onDraftChange,
  onSubmit,
  onClose,
}: BudgetEditModalProps) {
  return (
    <BudgetModalShell title="Set budget" onClose={onClose}>
      <form className="space-y-8" onSubmit={onSubmit}>
        <label className="flex h-14 items-center gap-2 rounded-sm border border-ring/40 bg-background px-4 text-lg shadow-[0_0_0_3px] shadow-ring/20">
          <span className="font-semibold text-foreground">{currencySymbol}</span>
          <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
          <input
            value={draftBudget}
            onChange={(e) => onDraftChange(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-base font-medium text-foreground outline-none"
            inputMode="decimal"
            aria-label="Budget amount"
          />
        </label>
        <div className="flex justify-center">
          <Button type="submit" size="lg" className="rounded-full px-10">
            Save
          </Button>
        </div>
      </form>
    </BudgetModalShell>
  );
}

import type { LucideIcon } from "lucide-react";

export type CurrencyCode = "THB" | "USD" | "EUR" | "JPY";

export type CurrencyOption = {
  code: CurrencyCode;
  label: string;
  symbol: string;
};

export type ExpenseItem = {
  id: string;
  amount: number;
  label: string;
  categoryId: string;
  date?: string;
};

export type ExpenseCategory = {
  id: string;
  label: string;
  Icon: LucideIcon;
};

export type BudgetModal = "expense" | "item" | "budget" | "settings" | "breakdown";

export type TripBudgetState = {
  currency: CurrencyCode;
  amount: number;
  expenses: ExpenseItem[];
};

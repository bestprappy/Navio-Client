import type { TripBlockData } from "../constants/types";
import type { CurrencyCode, ExpenseItem } from "./budget.types";
import { createClientId, roundMoney } from "./budget.utils";

export function legacyPlaceExpenseId(itemId: string): string {
  return `place-cost-${itemId}`;
}

function placeExpensePrefix(itemId: string): string {
  // The encoded visit ID and separator keep repeated visits and prefix IDs distinct.
  // The existing server already persists expense client IDs verbatim.
  return `place-expense-${encodeURIComponent(itemId)}/`;
}

export function createPlaceExpenseId(itemId: string): string {
  return `${placeExpensePrefix(itemId)}${createClientId("expense")}`;
}

export function isExpenseForPlace(expense: ExpenseItem, itemId: string): boolean {
  return expense.id === legacyPlaceExpenseId(itemId) || expense.id.startsWith(placeExpensePrefix(itemId));
}

export function getPlaceExpenses(expenses: ExpenseItem[], itemId: string): ExpenseItem[] {
  return expenses.filter((expense) => isExpenseForPlace(expense, itemId));
}

export function getPlaceExpenseTotal(expenses: ExpenseItem[], currency: CurrencyCode): number {
  return roundMoney(expenses.reduce((total, expense) => total + expense.amount, 0), currency);
}

export function reconcilePlaceExpenseCosts(
  blocks: TripBlockData[],
  previousExpenses: ExpenseItem[],
  nextExpenses: ExpenseItem[],
  currency: CurrencyCode,
): TripBlockData[] {
  return blocks.map((block) => ({
    ...block,
    items: block.items.map((item) => {
      if (item.type !== "place") return item;
      const next = getPlaceExpenses(nextExpenses, item.id);
      if (!next.length && !previousExpenses.some((expense) => isExpenseForPlace(expense, item.id))) return item;
      const cost = next.length ? getPlaceExpenseTotal(next, currency) : undefined;
      return item.cost === cost ? item : { ...item, cost };
    }),
  }));
}

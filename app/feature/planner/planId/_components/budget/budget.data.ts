import {
  Car,
  Fuel,
  Landmark,
  Luggage,
  Plane,
  ReceiptText,
  ShoppingBag,
  ShoppingCart,
  Ticket,
  Train,
  Utensils,
  Wine,
} from "lucide-react";

import type { CurrencyOption, ExpenseCategory, ExpenseItem } from "./budget.types";

export const currencyOptions: CurrencyOption[] = [
  { code: "THB", label: "Thai Baht", symbol: "TH" },
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "EUR" },
  { code: "JPY", label: "Japanese Yen", symbol: "JPY" },
];

export const expenseCategories: ExpenseCategory[] = [
  { id: "flights", label: "Flights", Icon: Plane },
  { id: "lodging", label: "Lodging", Icon: Luggage },
  { id: "car-rental", label: "Car rental", Icon: Car },
  { id: "transit", label: "Transit", Icon: Train },
  { id: "food", label: "Food", Icon: Utensils },
  { id: "drinks", label: "Drinks", Icon: Wine },
  { id: "sightseeing", label: "Sightseeing", Icon: Landmark },
  { id: "activities", label: "Activities", Icon: Ticket },
  { id: "shopping", label: "Shopping", Icon: ShoppingBag },
  { id: "gas", label: "Gas", Icon: Fuel },
  { id: "groceries", label: "Groceries", Icon: ShoppingCart },
  { id: "other", label: "Other", Icon: ReceiptText },
];

export const initialExpenses: ExpenseItem[] = [];

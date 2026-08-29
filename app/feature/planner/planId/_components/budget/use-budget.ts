"use client";

import { type FormEvent, useMemo, useState } from "react";
import { isValid, parseISO, format } from "date-fns";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useMutation } from "@tanstack/react-query";

import { getCurrencyRate } from "@/app/feature/planner/_components/planner-api";

import {
  convertTripCurrencyAtom,
  selectedTripPlacesAtom,
  tripBudgetAtom,
  tripCurrencyAtom,
  tripExpensesAtom,
} from "../overview/trip-builder.atoms";
import { expenseCategories, getExpenseCategory } from "./budget.data";
import { createClientId, roundMoney } from "./budget.utils";
import type {
  BudgetModal,
  CurrencyOption,
  ExpenseCategory,
  ExpenseItem,
} from "./budget.types";

export function useBudget() {
  const tripPlaces = useAtomValue(selectedTripPlacesAtom);
  const [activeModal, setActiveModal] = useState<BudgetModal | null>(null);
  const currency = useAtomValue(tripCurrencyAtom);
  const convertTripCurrency = useSetAtom(convertTripCurrencyAtom);
  const [budget, setBudget] = useAtom(tripBudgetAtom);
  const [draftBudget, setDraftBudget] = useState(budget.toFixed(2));
  const [expenses, setExpenses] = useAtom(tripExpensesAtom);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseName, setExpenseName] = useState("");
  const [expenseDate, setExpenseDate] = useState<Date | undefined>(undefined);
  const [selectedLabel, setSelectedLabel] = useState("Select item");
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory>(
    expenseCategories[11],
  );
  const [showAllTripItems, setShowAllTripItems] = useState(false);
  const currencyMutation = useMutation({
    mutationFn: ({ base, quote }: { base: CurrencyOption; quote: CurrencyOption }) =>
      getCurrencyRate(base.code, quote.code),
    onError: (error) => {
      console.error("Budget currency conversion failed.", {
        component: "BudgetSection",
        operation: "convertCurrency",
        from: currency.code,
        error,
      });
    },
  });

  const totalSpent = useMemo(
    () => expenses.reduce((total, e) => total + e.amount, 0),
    [expenses],
  );
  const progress = budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;
  const remaining = Math.max(budget - totalSpent, 0);
  const recentTripPlaces = showAllTripItems ? tripPlaces : tripPlaces.slice(0, 3);
  const breakdown = useMemo(
    () =>
      expenseCategories
        .map((cat) => ({
          ...cat,
          amount: expenses
            .filter((e) => e.categoryId === cat.id)
            .reduce((sum, e) => sum + e.amount, 0),
        }))
        .filter((cat) => cat.amount > 0)
        .sort((a, b) => b.amount - a.amount),
    [expenses],
  );

  function closeModal() {
    setActiveModal(null);
    setEditingExpenseId(null);
    resetExpenseDraft();
  }

  function openBudgetModal() {
    setDraftBudget(budget.toFixed(2));
    setActiveModal("budget");
  }

  function resetExpenseDraft() {
    setExpenseAmount("");
    setExpenseName("");
    setExpenseDate(undefined);
    setSelectedLabel("Select item");
    setSelectedCategory(expenseCategories[11]);
  }

  function openExpenseModal(expense?: ExpenseItem) {
    if (expense) {
      setEditingExpenseId(expense.id);
      setExpenseAmount(expense.amount.toString());
      setExpenseName(expense.label);
      setExpenseDate(parseExpenseDate(expense.date));
      const cat = getExpenseCategory(expense.categoryId);
      setSelectedCategory(cat);
      setSelectedLabel(expense.label !== cat.label ? expense.label : cat.label);
    } else {
      setEditingExpenseId(null);
      resetExpenseDraft();
    }
    setActiveModal("expense");
  }

  function saveExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = roundMoney(Number(expenseAmount), currency.code);
    if (!Number.isFinite(amount) || amount <= 0) return;
    const resolvedLabel =
      expenseName.trim() ||
      (selectedLabel === "Select item" ? selectedCategory.label : selectedLabel);
    const expenseFields = {
      amount,
      label: resolvedLabel,
      categoryId: selectedCategory.id,
      date: expenseDate ? format(expenseDate, "yyyy-MM-dd") : undefined,
    };
    if (editingExpenseId) {
      setExpenses((prev) =>
        prev.map((e) => (e.id === editingExpenseId ? { ...e, ...expenseFields } : e)),
      );
    } else {
      setExpenses((prev) => [
        { id: createClientId("expense"), ...expenseFields },
        ...prev,
      ]);
    }
    resetExpenseDraft();
    closeModal();
  }

  function deleteExpense(id: string) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  function saveBudget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = roundMoney(Number(draftBudget), currency.code);
    if (!Number.isFinite(amount) || amount < 0) return;
    setBudget(amount);
    closeModal();
  }

  function selectTripPlaceItem(name: string) {
    setSelectedLabel(name);
    setSelectedCategory(expenseCategories[11]);
    setActiveModal("expense");
  }

  function selectCategory(category: ExpenseCategory) {
    setSelectedCategory(category);
    setSelectedLabel(category.label);
    setActiveModal("expense");
  }

  function toggleShowAllTripItems() {
    setShowAllTripItems((v) => !v);
  }

  async function changeCurrency(option: CurrencyOption) {
    if (option.code === currency.code || currencyMutation.isPending) return;
    try {
      const response = await currencyMutation.mutateAsync({
        base: currency,
        quote: option,
      });
      convertTripCurrency({ currency: option, rate: response.rate });
    } catch {
      // The mutation exposes the user-facing error while leaving every amount unchanged.
    }
  }

  return {
    tripPlaces,
    recentTripPlaces,
    activeModal,
    setActiveModal,
    editingExpenseId,
    currency,
    changeCurrency,
    isConvertingCurrency: currencyMutation.isPending,
    currencyConversionError: currencyMutation.isError
      ? "Could not load an exchange rate. Your amounts were not changed."
      : null,
    budget,
    draftBudget,
    setDraftBudget,
    expenses,
    expenseAmount,
    setExpenseAmount,
    expenseName,
    setExpenseName,
    expenseDate,
    setExpenseDate,
    selectedLabel,
    selectedCategory,
    showAllTripItems,
    totalSpent,
    progress,
    remaining,
    breakdown,
    closeModal,
    openBudgetModal,
    openExpenseModal,
    saveExpense,
    saveBudget,
    deleteExpense,
    selectTripPlaceItem,
    selectCategory,
    toggleShowAllTripItems,
  };
}

function parseExpenseDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : undefined;
}

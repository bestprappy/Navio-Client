"use client";

import { type FormEvent, useMemo, useState } from "react";
import { format } from "date-fns";
import { useAtom, useAtomValue } from "jotai";

import { selectedTripPlacesAtom, tripCurrencyAtom, tripExpensesAtom } from "../overview/trip-builder.atoms";
import { expenseCategories } from "./budget.data";
import { createClientId } from "./budget.utils";
import type {
  BudgetModal,
  ExpenseCategory,
  ExpenseItem,
} from "./budget.types";

export function useBudget() {
  const tripPlaces = useAtomValue(selectedTripPlacesAtom);
  const [activeModal, setActiveModal] = useState<BudgetModal | null>(null);
  const [currency, setCurrency] = useAtom(tripCurrencyAtom);
  const [budget, setBudget] = useState(0);
  const [draftBudget, setDraftBudget] = useState("0.00");
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
      setExpenseDate(expense.rawDate);
      const cat = expenseCategories.find((c) => c.id === expense.categoryId) ?? expenseCategories[11];
      setSelectedCategory(cat);
      setSelectedLabel(expense.label !== expense.categoryLabel ? expense.label : cat.label);
    } else {
      setEditingExpenseId(null);
      resetExpenseDraft();
    }
    setActiveModal("expense");
  }

  function saveExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(expenseAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    const resolvedLabel =
      expenseName.trim() ||
      (selectedLabel === "Select item" ? selectedCategory.label : selectedLabel);
    const expenseFields = {
      amount,
      label: resolvedLabel,
      categoryId: selectedCategory.id,
      categoryLabel: selectedCategory.label,
      Icon: selectedCategory.Icon,
      date: expenseDate ? format(expenseDate, "MMM d, yyyy") : undefined,
      rawDate: expenseDate,
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
    const amount = Number(draftBudget);
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

  return {
    tripPlaces,
    recentTripPlaces,
    activeModal,
    setActiveModal,
    editingExpenseId,
    currency,
    setCurrency,
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

"use client";

import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { getPlanById } from "@/app/feature/explore/_components/data";
import { ensureItineraryDays } from "../itinerary/itinerary-days";
import { currencyOptions, getCurrencyOption } from "../budget/budget.data";
import { getCopiedPlanBlocks } from "../constants/planner-template";
import {
  activeBlockIdAtom,
  activeSearchAtom,
  evChargerErrorAtom,
  evChargerLoadingAtom,
  evChargerResultsAtom,
  openBlockIdsAtom,
  selectedEvChargerIdAtom,
  selectedTripPlaceItemIdAtom,
  tripBlocksAtom,
  activePlannerKeyAtom,
  tripBudgetAtom,
  tripCurrencyAtom,
  tripDateRangeAtom,
  tripExpensesAtom,
} from "./trip-builder.atoms";

const CATEGORY_MAP: Record<string, string> = {
  accommodation: "lodging",
  food: "food",
  activities: "activities",
  transport: "transit",
  shopping: "shopping",
  charging: "gas",
  other: "other",
};

type PlannerTemplateHydratorProps = {
  guest?: boolean;
  planId?: string;
  templatePlanId?: string;
  from?: string;
  to?: string;
};

export function PlannerTemplateHydrator({
  guest = false,
  planId,
  templatePlanId,
  from,
  to,
}: PlannerTemplateHydratorProps) {
  const blocks = useAtomValue(tripBlocksAtom);
  const activePlannerKey = useAtomValue(activePlannerKeyAtom);
  const setTripBlocks = useSetAtom(tripBlocksAtom);
  const setActivePlannerKey = useSetAtom(activePlannerKeyAtom);
  const setOpenBlockIds = useSetAtom(openBlockIdsAtom);
  const setActiveBlockId = useSetAtom(activeBlockIdAtom);
  const setTripDateRange = useSetAtom(tripDateRangeAtom);
  const setActiveSearch = useSetAtom(activeSearchAtom);
  const setSelectedEvChargerId = useSetAtom(selectedEvChargerIdAtom);
  const setSelectedTripPlaceItemId = useSetAtom(selectedTripPlaceItemIdAtom);
  const setEvChargerResults = useSetAtom(evChargerResultsAtom);
  const setEvChargerLoading = useSetAtom(evChargerLoadingAtom);
  const setEvChargerError = useSetAtom(evChargerErrorAtom);
  const setTripBudget = useSetAtom(tripBudgetAtom);
  const setTripExpenses = useSetAtom(tripExpensesAtom);
  const setTripCurrency = useSetAtom(tripCurrencyAtom);

  useEffect(() => {
    const plannerKey = `${planId ?? "unknown"}:${templatePlanId ?? "new"}:${from ?? ""}:${to ?? ""}`;

    if (activePlannerKey === plannerKey && blocks.length > 0) {
      return;
    }

    setActivePlannerKey(plannerKey);

    // Always reset all planner state when navigating to a new plan
    setTripBlocks([]);
    setOpenBlockIds([]);
    setActiveBlockId(null);
    setTripDateRange({ from, to });
    setActiveSearch(null);
    setSelectedEvChargerId(null);
    setSelectedTripPlaceItemId(null);
    setEvChargerResults([]);
    setEvChargerLoading(false);
    setEvChargerError(null);
    setTripBudget(0);
    setTripExpenses([]);
    setTripCurrency(currencyOptions[0]);

    if (!templatePlanId) {
      if (guest) {
        const days = ensureItineraryDays([], from || new Date().toISOString().slice(0, 10), to);
        setTripBlocks(days);
        setOpenBlockIds(days.slice(0, 5).map((day) => day.id));
        setActiveBlockId(days[0]?.id ?? null);
      }
      return;
    }

    const templateBlocks = getCopiedPlanBlocks(templatePlanId, from);
    const copiedBlocks = guest ? ensureItineraryDays(templateBlocks, from, to) : templateBlocks;

    if (copiedBlocks.length === 0) {
      console.error("Copied plan template was empty.", {
        component: "PlannerTemplateHydrator",
        operation: "hydrateTemplate",
        templatePlanId,
      });
      return;
    }

    setTripBlocks(copiedBlocks);
    setOpenBlockIds(copiedBlocks.map((block) => block.id));
    setActiveBlockId(copiedBlocks[0]?.id ?? null);

    const plan = getPlanById(templatePlanId);

    // The account garage is restored by GarageProvider, independently of trip templates.

    // Hydrate budget
    if (plan?.budget) {
      const { budget } = plan;

      const currencyOption = getCurrencyOption(budget.currency);
      setTripCurrency(currencyOption);
      setTripBudget(budget.total);

      const expenses = budget.items.map((item) => {
        const categoryId = CATEGORY_MAP[item.category] ?? "other";
        return {
          id: `copied-expense-${item.id}`,
          amount: item.amount,
          label: item.name,
          categoryId,
          date: item.date,
        };
      });
      setTripExpenses(expenses);
    } else {
      setTripBudget(0);
      setTripExpenses([]);
    }
  }, [
    guest,
    activePlannerKey,
    blocks.length,
    from,
    planId,
    setActiveBlockId,
    setActiveSearch,
    setActivePlannerKey,
    setEvChargerError,
    setEvChargerLoading,
    setEvChargerResults,
    setOpenBlockIds,
    setSelectedEvChargerId,
    setSelectedTripPlaceItemId,
    setTripBlocks,
    setTripBudget,
    setTripCurrency,
    setTripDateRange,
    setTripExpenses,
    templatePlanId,
    to,
  ]);

  return null;
}

"use client";

import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { getPlanById } from "@/app/feature/explore/_components/data";
import { expenseCategories, currencyOptions } from "../budget/budget.data";
import { getCopiedPlanBlocks } from "../constants/planner-template";
import { getPlanGarageUserVehicle } from "../constants/template-ev";
import {
  activeVehicleIdAtom,
  startingBatteryPctAtom,
  userVehiclesAtom,
} from "../garage/garage.atoms";
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
  planId?: string;
  templatePlanId?: string;
  from?: string;
  to?: string;
};

export function PlannerTemplateHydrator({
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
  const setUserVehicles = useSetAtom(userVehiclesAtom);
  const setActiveVehicleId = useSetAtom(activeVehicleIdAtom);
  const setStartingBatteryPct = useSetAtom(startingBatteryPctAtom);
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
    setUserVehicles([]);
    setActiveVehicleId(null);
    setStartingBatteryPct(80);
    setTripBudget(0);
    setTripExpenses([]);
    setTripCurrency(currencyOptions[0]);

    if (!templatePlanId) {
      return;
    }

    const copiedBlocks = getCopiedPlanBlocks(templatePlanId, from);

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

    // Hydrate garage
    if (plan?.garage) {
      const { garage } = plan;
      const vehicleId = `vehicle-copied-${templatePlanId}`;
      setUserVehicles([getPlanGarageUserVehicle(vehicleId, garage, 80)]);
      setActiveVehicleId(vehicleId);
      setStartingBatteryPct(80);
    } else {
      setUserVehicles([]);
      setActiveVehicleId(null);
    }

    // Hydrate budget
    if (plan?.budget) {
      const { budget } = plan;

      const currencyOption =
        currencyOptions.find((c) => c.code === budget.currency) ??
        currencyOptions[0];
      setTripCurrency(currencyOption);
      setTripBudget(budget.total);

      const expenses = budget.items.map((item) => {
        const categoryId = CATEGORY_MAP[item.category] ?? "other";
        const category =
          expenseCategories.find((c) => c.id === categoryId) ??
          expenseCategories[expenseCategories.length - 1];
        return {
          id: `copied-expense-${item.id}`,
          amount: item.amount,
          label: item.name,
          categoryId: category.id,
          categoryLabel: category.label,
          Icon: category.Icon,
          date: item.date
            ? new Date(item.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : undefined,
          rawDate: item.date ? new Date(item.date) : undefined,
        };
      });
      setTripExpenses(expenses);
    } else {
      setTripBudget(0);
      setTripExpenses([]);
    }
  }, [
    activePlannerKey,
    blocks.length,
    from,
    planId,
    setActiveBlockId,
    setActiveSearch,
    setActivePlannerKey,
    setActiveVehicleId,
    setEvChargerError,
    setEvChargerLoading,
    setEvChargerResults,
    setOpenBlockIds,
    setSelectedEvChargerId,
    setSelectedTripPlaceItemId,
    setStartingBatteryPct,
    setTripBlocks,
    setTripBudget,
    setTripCurrency,
    setTripDateRange,
    setTripExpenses,
    setUserVehicles,
    templatePlanId,
    to,
  ]);

  return null;
}

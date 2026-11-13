"use client";

import { useAtomValue } from "jotai";

import { SectionTourButton } from "@/components/tour/section-tour-button";
import type { TourDefinition } from "@/components/tour/tour.types";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { plannerReadOnlyAtom } from "../overview/trip-builder.atoms";

type PlannerSectionTipsProps = {
  /** Section name for the accessible label, for example "Itinerary". */
  section: string;
  tours: readonly TourDefinition[];
};

/**
 * The "?" beside a planner section heading. Only the person editing the plan
 * sees it; shared and read-only plans have nothing to teach.
 */
export function PlannerSectionTips({ section, tours }: PlannerSectionTipsProps) {
  const readOnly = useAtomValue(plannerReadOnlyAtom);
  const { isAuthenticated } = useRequireAuth();
  if (readOnly || !isAuthenticated) return null;
  return <SectionTourButton section={section} tours={tours} />;
}

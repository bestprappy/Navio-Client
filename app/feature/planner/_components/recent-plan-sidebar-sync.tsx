"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSession } from "next-auth/react";

import {
  activeBlockIdAtom,
  openBlockIdsAtom,
  tripBlocksAtom,
} from "../planId/_components/overview/trip-builder.atoms";
import { isPersistedTripId } from "./planner-api";
import {
  pendingPlannerBlockIdAtom,
  recentPlanSidebarAtom,
  recentPlanSidebarStore,
} from "./recent-plan-sidebar";

type RecentPlanSidebarSyncProps = {
  planId?: string;
};

/** Mirrors the open plan into the shared sidebar snapshot and reveals a day picked from another page. */
export function RecentPlanSidebarSync({ planId }: RecentPlanSidebarSyncProps) {
  const blocks = useAtomValue(tripBlocksAtom);
  const setActiveBlockId = useSetAtom(activeBlockIdAtom);
  const setOpenBlockIds = useSetAtom(openBlockIdsAtom);
  const setRecentPlan = useSetAtom(recentPlanSidebarAtom, { store: recentPlanSidebarStore });
  const [pendingBlockId, setPendingBlockId] = useAtom(pendingPlannerBlockIdAtom, { store: recentPlanSidebarStore });
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const ownerId = status === "authenticated" ? session?.user?.id : undefined;

  useEffect(() => {
    // Guest plans are temporary; never offer them as a way back from other pages.
    if (!ownerId || !isPersistedTripId(planId) || blocks.length === 0) return;
    setRecentPlan({ planId, ownerId, blocks, href: `${pathname}${window.location.search}` });
  }, [blocks, ownerId, pathname, planId, setRecentPlan]);

  useEffect(() => {
    if (!pendingBlockId || !blocks.some((block) => block.id === pendingBlockId)) return;
    setActiveBlockId(pendingBlockId);
    setOpenBlockIds((ids) => (ids.includes(pendingBlockId) ? ids : [...ids, pendingBlockId]));
    setPendingBlockId(null);
    requestAnimationFrame(() =>
      document.getElementById(`trip-block-${pendingBlockId}`)?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }, [blocks, pendingBlockId, setActiveBlockId, setOpenBlockIds, setPendingBlockId]);

  return null;
}

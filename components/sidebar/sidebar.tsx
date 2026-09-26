"use client";

import type { MouseEvent } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSession } from "next-auth/react";
import { format, isValid, parseISO } from "date-fns";
import {
  CalendarDays,
  ClipboardList,
  CarFront,
  Compass,
  Gauge,
  LayoutDashboard,
  ListChecks,
  Map,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Logo } from "@/components/logo";
import { ProfileMenu } from "@/components/profile/profile-menu";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button.variants";
import { SidebarTrips } from "@/app/feature/planner/_components/sidebar-trips";
import useSidebar from "@/hooks/useSidebar";
import { sidebarCollapsedAtom } from "@/app/configs/constant";
import type { TripBlockData } from "@/app/feature/planner/planId/_components/constants/types";
import { getTripBlockColorById } from "@/app/feature/planner/planId/_components/constants/trip-block-colors";
import {
  activeBlockIdAtom,
  tripBlocksAtom,
  openBlockIdsAtom,
} from "@/app/feature/planner/planId/_components/overview/trip-builder.atoms";
import {
  pendingPlannerBlockIdAtom,
  recentPlanSidebarAtom,
  recentPlanSidebarStore,
} from "@/app/feature/planner/_components/recent-plan-sidebar";
import { canUseAdminConsole, isAdministrator } from "@/lib/navio-roles";
import { cn } from "@/lib/utils";

import SidebarItem from "./sidebar.item";
import SidebarMenu from "./sidebar.menu";
import { SidebarAccountActions } from "./sidebar-account-actions";

const PLANNER_SCROLL_PANEL_ID = "planner-scroll-panel";

function isPlannerDetailPath(pathName: string) {
  return /^\/planner\/[^/]+/.test(pathName);
}

function scrollPlannerToTop() {
  document
    .getElementById(PLANNER_SCROLL_PANEL_ID)
    ?.scrollTo({ top: 0, behavior: "smooth" });
}

function scrollToTripBlock(blockId: string) {
  document
    .getElementById(`trip-block-${blockId}`)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function formatBlockDate(date: string) {
  const parsedDate = parseISO(date);

  if (!isValid(parsedDate)) {
    return date;
  }

  return format(parsedDate, "MMM d");
}

type PlannerBlockSidebarGroupProps = {
  activeBlockId: string | null;
  blocks: TripBlockData[];
  collapsed: boolean;
  getPrimaryLabel: (block: TripBlockData, index: number) => string;
  getSecondaryLabel?: (block: TripBlockData, index: number) => string | null;
  Icon: LucideIcon;
  onSelectBlock: (blockId: string) => void;
  title: string;
};

function PlannerBlockSidebarGroup({
  activeBlockId,
  blocks,
  collapsed,
  getPrimaryLabel,
  getSecondaryLabel,
  Icon,
  onSelectBlock,
  title,
}: PlannerBlockSidebarGroupProps) {
  const [showAll, setShowAll] = useState(false);
  const visibleBlocks = showAll ? blocks : blocks.filter((block, index) => index < 5 || block.id === activeBlockId);
  if (!blocks.length) {
    return null;
  }

  return (
    <div
      className={cn(
        "mt-1 flex flex-col gap-1",
        collapsed ? "items-center" : "ml-5 border-l border-border/70 pl-3",
      )}
    >
      {collapsed ? (
        <div
          className="flex size-9 items-center justify-center text-muted-foreground"
          title={title}
          aria-hidden="true"
        >
          <Icon className="size-4" />
        </div>
      ) : (
        <p className="mb-1 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Icon className="size-3.5" aria-hidden="true" />
          {title}
        </p>
      )}

      {visibleBlocks.map((block) => {
        const index = blocks.findIndex((item) => item.id === block.id);
        const blockColor = getTripBlockColorById(block.colorId);
        const primaryLabel = getPrimaryLabel(block, index);
        const secondaryLabel = getSecondaryLabel?.(block, index) ?? null;
        const buttonTitle = secondaryLabel
          ? `${primaryLabel} - ${secondaryLabel}`
          : primaryLabel;
        const isActive = activeBlockId === block.id;

        return (
          <button
            key={block.id}
            type="button"
            title={buttonTitle}
            aria-label={buttonTitle}
            aria-current={isActive ? "true" : undefined}
            onClick={() => onSelectBlock(block.id)}
            className={cn(
              "group flex min-h-9 items-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring/30",
              collapsed ? "w-9 justify-center px-0" : "w-full gap-2 px-2",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "shrink-0 rounded-full",
                collapsed ? "size-2.5" : "size-2",
              )}
              style={{ backgroundColor: blockColor.value }}
              aria-hidden="true"
            />
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1 truncate text-left">
                  {primaryLabel}
                </span>
                {secondaryLabel ? (
                  <span
                    className={cn(
                      "shrink-0 text-xs",
                      isActive
                        ? "text-sidebar-accent-foreground/80"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  >
                    {secondaryLabel}
                  </span>
                ) : null}
              </>
            )}
          </button>
        );
      })}
      {blocks.length > 5 && <button type="button" aria-expanded={showAll} className="min-h-10 rounded-lg px-2 text-xs font-medium text-primary hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setShowAll(!showAll)}>{showAll ? "Show less" : `Show all ${blocks.length}`}</button>}
    </div>
  );
}

export default function SidebarWrapper() {
  const { activeSidebar, setActiveSidebar } = useSidebar();
  const [collapsed, setCollapsed] = useAtom(sidebarCollapsedAtom);
  const pathName = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const isPlannerDetail = isPlannerDetailPath(pathName);
  const planBlocks = useAtomValue(tripBlocksAtom);
  const recentPlan = useAtomValue(recentPlanSidebarAtom, { store: recentPlanSidebarStore });
  const setPendingBlockId = useSetAtom(pendingPlannerBlockIdAtom, { store: recentPlanSidebarStore });
  // Outside a plan, keep showing the last saved plan this account opened.
  const visibleRecentPlan = !isPlannerDetail && recentPlan && recentPlan.ownerId === session?.user?.id ? recentPlan : null;
  const blocks = isPlannerDetail ? planBlocks : visibleRecentPlan?.blocks ?? [];
  const itineraryBlocks = blocks.filter((block) => block.kind !== "list");
  const listBlocks = blocks.filter((block) => block.kind === "list");
  const planActiveBlockId = useAtomValue(activeBlockIdAtom);
  const activeBlockId = isPlannerDetail ? planActiveBlockId : null;
  const setActiveBlockId = useSetAtom(activeBlockIdAtom);
  const [mobileOpen, setMobileOpen] = useState(false);
  const setOpenBlocks = useSetAtom(openBlockIdsAtom);

  useEffect(() => {
    setActiveSidebar(pathName);
  }, [pathName, setActiveSidebar]);

  const isRouteActive = (route: string) =>
    activeSidebar === route || activeSidebar.startsWith(`${route}/`);

  function handlePlannerClick(event: MouseEvent<HTMLAnchorElement>) {
    setMobileOpen(false);
    if (!isPlannerDetail) {
      return;
    }

    event.preventDefault();
    setActiveSidebar(pathName);
    scrollPlannerToTop();
  }

  function handleSelectBlock(blockId: string) {
    if (!isPlannerDetail) {
      if (!visibleRecentPlan) return;
      setPendingBlockId(blockId);
      setMobileOpen(false);
      router.push(visibleRecentPlan.href);
      return;
    }

    setActiveBlockId(blockId);
    setOpenBlocks((ids) => ids.includes(blockId) ? ids : [...ids, blockId]);
    setMobileOpen(false);
    requestAnimationFrame(() => scrollToTripBlock(blockId));
  }

  return (
    <>
    <header className="z-40 flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:hidden">
      <Link href="/" aria-label="Navio home" className="flex items-center gap-2 font-semibold"><Logo className="size-6" />Navio</Link>
      <div className="flex items-center gap-2"><ProfileMenu compact /><button type="button" aria-label={mobileOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileOpen} className="flex size-10 items-center justify-center rounded-lg hover:bg-muted" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <PanelLeftClose className="size-5" /> : <PanelLeftOpen className="size-5" />}</button></div>
    </header>
    <aside
      className={`absolute bottom-0 left-0 top-14 z-30 shrink-0 flex-col overflow-hidden border-r border-border bg-card shadow-sm md:static md:flex md:h-full ${mobileOpen ? "flex" : "hidden"} ${
        collapsed ? "w-24 px-2 py-3" : "w-72 px-4 py-3"
      }`}
    >
      <div className="flex shrink-0 items-center justify-between gap-1 border-b border-border/50 pb-3">
        <ProfileMenu compact={collapsed} onNavigate={() => setMobileOpen(false)} />
        <Button variant="ghost" size="icon" onClick={() => setCollapsed((previous) => !previous)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="shrink-0 text-muted-foreground">{collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}</Button>
      </div>

      {/* Nav */}
      <nav
        aria-label="Primary navigation"
        className="scrollbar-hide mt-3 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain"
      >
        <Link href="/planner/new" onClick={() => setMobileOpen(false)} aria-label="New trip" title="New trip"
          className={cn(buttonVariants({ size: "lg" }), "w-full rounded-full", collapsed && "px-0")}>
          <Plus className="size-4" aria-hidden="true" />{!collapsed && "New Trip"}
        </Link>
        <SidebarTrips collapsed={collapsed} onNavigate={() => setMobileOpen(false)} />
        <SidebarMenu title="Travel" collapsed={collapsed}>
          <SidebarItem
            title="Dashboard"
            href="/dashboard"
            icon={<LayoutDashboard className="size-5" />}
            isActive={isRouteActive("/dashboard")}
            onClick={() => setMobileOpen(false)}
            collapsed={collapsed}
          />
          <SidebarItem
            title="Planner"
            href={isPlannerDetail ? pathName : visibleRecentPlan?.href ?? "/planner/new"}
            icon={<Map className="size-5" />}
            isActive={isRouteActive("/planner")}
            onClick={handlePlannerClick}
            collapsed={collapsed}
          />
          {isPlannerDetail || visibleRecentPlan ? (
            <>
              <PlannerBlockSidebarGroup
                activeBlockId={activeBlockId}
                blocks={listBlocks}
                collapsed={collapsed}
                getPrimaryLabel={(block, index) =>
                  block.title.trim() || `List ${index + 1}`
                }
                getSecondaryLabel={(block) =>
                  `${block.items.length} item${block.items.length === 1 ? "" : "s"}`
                }
                Icon={ListChecks}
                onSelectBlock={handleSelectBlock}
                title="My List"
              />
              <PlannerBlockSidebarGroup
                activeBlockId={activeBlockId}
                blocks={itineraryBlocks}
                collapsed={collapsed}
                getPrimaryLabel={(_block, index) => `Day ${index + 1}`}
                getSecondaryLabel={(block) => formatBlockDate(block.date)}
                Icon={CalendarDays}
                onSelectBlock={handleSelectBlock}
                title="Itinerary"
              />
            </>
          ) : null}
        </SidebarMenu>
        <SidebarMenu title="Discover" collapsed={collapsed}>
          <SidebarItem
            title="Explore"
            href="/explore"
            icon={<Compass className="size-5" />}
            isActive={isRouteActive("/explore")}
            onClick={() => setMobileOpen(false)}
            collapsed={collapsed}
          />
          <SidebarItem
            title="Community"
            href="/community"
            icon={<MessageCircle className="size-5" />}
            isActive={isRouteActive("/community")}
            onClick={() => setMobileOpen(false)}
            collapsed={collapsed}
          />
        </SidebarMenu>
        {canUseAdminConsole(session?.user?.roles) ? (
          <SidebarMenu title="Admin" collapsed={collapsed}>
            <SidebarItem
              title="Admin dashboard"
              href="/admin"
              icon={<Gauge className="size-5" />}
              isActive={activeSidebar === "/admin"}
              onClick={() => setMobileOpen(false)}
              collapsed={collapsed}
            />
            <SidebarItem
              title="Users"
              href="/admin/users"
              icon={<Users className="size-5" />}
              isActive={isRouteActive("/admin/users")}
              onClick={() => setMobileOpen(false)}
              collapsed={collapsed}
            />
            {isAdministrator(session?.user?.roles) && <SidebarItem title="Vehicle catalog" href="/admin/vehicles" icon={<CarFront className="size-5" />} isActive={isRouteActive("/admin/vehicles")} onClick={() => setMobileOpen(false)} collapsed={collapsed} />}
            {isAdministrator(session?.user?.roles) && <SidebarItem title="Activity" href="/admin/activity" icon={<ClipboardList className="size-5" />} isActive={isRouteActive("/admin/activity")} onClick={() => setMobileOpen(false)} collapsed={collapsed} />}
          </SidebarMenu>
        ) : null}
      </nav>
      <SidebarAccountActions collapsed={collapsed} onNavigate={() => setMobileOpen(false)} />
    </aside>
    </>
  );
}

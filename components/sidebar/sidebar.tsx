"use client";

import type { MouseEvent } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { format, isValid, parseISO } from "date-fns";
import {
  CalendarDays,
  Compass,
  Home,
  ListChecks,
  Map,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  type LucideIcon,
} from "lucide-react";

import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import useSidebar from "@/hooks/useSidebar";
import { sidebarCollapsedAtom } from "@/app/configs/constant";
import type { TripBlockData } from "@/app/feature/planner/planId/_components/constants/types";
import { getTripBlockColorById } from "@/app/feature/planner/planId/_components/constants/trip-block-colors";
import {
  activeBlockIdAtom,
  tripBlocksAtom,
  openBlockIdsAtom,
} from "@/app/feature/planner/planId/_components/overview/trip-builder.atoms";
import { cn } from "@/lib/utils";

import SidebarItem from "./sidebar.item";
import SidebarMenu from "./sidebar.menu";

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
                ? "bg-secondary text-secondary-foreground"
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
                        ? "text-secondary-foreground/80"
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
  const blocks = useAtomValue(tripBlocksAtom);
  const itineraryBlocks = blocks.filter((block) => block.kind !== "list");
  const listBlocks = blocks.filter((block) => block.kind === "list");
  const activeBlockId = useAtomValue(activeBlockIdAtom);
  const setActiveBlockId = useSetAtom(activeBlockIdAtom);
  const pathName = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const setOpenBlocks = useSetAtom(openBlockIdsAtom);
  const isPlannerDetail = isPlannerDetailPath(pathName);

  useEffect(() => {
    setActiveSidebar(pathName);
  }, [pathName, setActiveSidebar]);

  const isRouteActive = (route: string) => {
    if (route === "/") return activeSidebar === "/";
    return activeSidebar === route || activeSidebar.startsWith(`${route}/`);
  };

  function handlePlannerClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!isPlannerDetail) {
      return;
    }

    event.preventDefault();
    setActiveSidebar(pathName);
    scrollPlannerToTop();
  }

  function handleSelectBlock(blockId: string) {
    setActiveBlockId(blockId);
    setOpenBlocks((ids) => ids.includes(blockId) ? ids : [...ids, blockId]);
    setMobileOpen(false);
    requestAnimationFrame(() => scrollToTripBlock(blockId));
  }

  return (
    <>
    <header className="z-40 flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:hidden">
      <Link href="/" aria-label="Navio home" className="flex items-center gap-2 font-semibold"><Logo className="size-6" />Navio</Link>
      <div className="flex items-center gap-2"><ThemeToggle /><button type="button" aria-label={mobileOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileOpen} className="flex size-10 items-center justify-center rounded-lg hover:bg-muted" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <PanelLeftClose className="size-5" /> : <PanelLeftOpen className="size-5" />}</button></div>
    </header>
    <aside
      className={`absolute bottom-0 left-0 top-14 z-30 shrink-0 flex-col overflow-hidden border-r border-border bg-card shadow-sm md:static md:flex md:h-full ${mobileOpen ? "flex" : "hidden"} ${
        collapsed ? "w-24 px-2 py-3" : "w-56 px-3 py-3"
      }`}
    >
      <div className="flex shrink-0 items-center justify-between gap-1 border-b border-border/50 pb-3">
        <Link href="/" aria-label="Navio home" className="flex min-w-0 items-center gap-2 rounded-lg p-1 focus-visible:ring-2 focus-visible:ring-ring">
          <Logo className="size-7 shrink-0" />
          {!collapsed && <span className="min-w-0"><span className="block text-sm font-bold">Navio</span><span className="block text-xs text-muted-foreground">EV trip planner</span></span>}
        </Link>
        <button type="button" onClick={() => setCollapsed((previous) => !previous)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">{collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}</button>
      </div>

      {/* Nav */}
      <nav
        aria-label="Primary navigation"
        className="mt-3 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain"
      >
        <SidebarMenu title="Travel" collapsed={collapsed}>
          <SidebarItem
            title="Home"
            href="/"
            icon={<Home className="size-5" />}
            isActive={isRouteActive("/")}
            collapsed={collapsed}
          />
          <SidebarItem
            title="Explore"
            href="/explore"
            icon={<Compass className="size-5" />}
            isActive={isRouteActive("/explore")}
            collapsed={collapsed}
          />
          <SidebarItem
            title="Community"
            href="/community"
            icon={<MessageCircle className="size-5" />}
            isActive={isRouteActive("/community")}
            collapsed={collapsed}
          />
          <SidebarItem
            title="Planner"
            href={isPlannerDetail ? pathName : "/planner"}
            icon={<Map className="size-5" />}
            isActive={isRouteActive("/planner")}
            onClick={handlePlannerClick}
            collapsed={collapsed}
          />
          {isPlannerDetail ? (
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

        <SidebarMenu title="Utility" collapsed={collapsed}>
          <SidebarItem
            title="Settings"
            href="/settings"
            icon={<Settings className="size-5" />}
            isActive={isRouteActive("/settings")}
            collapsed={collapsed}
          />
        </SidebarMenu>
      </nav>

      {/* Footer */}
      <div className="mt-6 flex flex-col gap-3">
        {collapsed ? (
          <div className="flex justify-center">
            <ThemeToggle />
          </div>
        ) : (
          <>
            <ThemeToggle showLabel className="w-full justify-start px-3" />
            <div className="rounded-md border border-border bg-background p-3">
              <p className="text-xs font-semibold text-foreground">
                Your trip workspace
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Plan routes, dates, and map stops from one place.
              </p>
            </div>
          </>
        )}
      </div>
    </aside>
    </>
  );
}

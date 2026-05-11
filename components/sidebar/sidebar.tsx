"use client";

import type { MouseEvent } from "react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { format, isValid, parseISO } from "date-fns";
import {
  CalendarDays,
  Compass,
  Home,
  Map,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
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

type ItinerarySidebarNavProps = {
  activeBlockId: string | null;
  blocks: TripBlockData[];
  collapsed: boolean;
  onSelectBlock: (blockId: string) => void;
};

function ItinerarySidebarNav({
  activeBlockId,
  blocks,
  collapsed,
  onSelectBlock,
}: ItinerarySidebarNavProps) {
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
          title="Itinerary"
          aria-hidden="true"
        >
          <CalendarDays className="size-4" />
        </div>
      ) : (
        <p className="mb-1 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <CalendarDays className="size-3.5" aria-hidden="true" />
          Itinerary
        </p>
      )}

      {blocks.map((block, index) => {
        const blockColor = getTripBlockColorById(block.colorId);
        const dateLabel = formatBlockDate(block.date);
        const title = `Day ${index + 1} - ${dateLabel}`;
        const isActive = activeBlockId === block.id;

        return (
          <button
            key={block.id}
            type="button"
            title={title}
            aria-label={title}
            aria-current={isActive ? "date" : undefined}
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
                  Day {index + 1}
                </span>
                <span
                  className={cn(
                    "shrink-0 text-xs",
                    isActive
                      ? "text-secondary-foreground/80"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
                >
                  {dateLabel}
                </span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function SidebarWrapper() {
  const { activeSidebar, setActiveSidebar } = useSidebar();
  const [collapsed, setCollapsed] = useAtom(sidebarCollapsedAtom);
  const blocks = useAtomValue(tripBlocksAtom);
  const activeBlockId = useAtomValue(activeBlockIdAtom);
  const setActiveBlockId = useSetAtom(activeBlockIdAtom);
  const pathName = usePathname();
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
    scrollToTripBlock(blockId);
  }

  return (
    <aside
      className={`sticky top-0 z-30 hidden h-screen shrink-0 overflow-y-auto border-r border-border bg-card shadow-sm transition-all duration-200 ease-in-out md:flex md:flex-col ${
        collapsed ? "w-16 px-2 py-4" : "w-52 px-3 py-4"
      }`}
    >
      {/* Header: logo + collapse toggle */}
      <div
        className={`flex items-center py-2 ${collapsed ? "justify-center px-0" : "gap-3 px-3"}`}
      >
        {!collapsed && (
          <>
            <Logo className="size-8 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-foreground">Navio</p>
              <p className="text-xs text-muted-foreground">EV trip planner</p>
            </div>
          </>
        )}

        <button
          onClick={() => setCollapsed((prev) => !prev)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </button>
      </div>

      {/* Nav */}
      <nav
        aria-label="Primary navigation"
        className="mt-6 flex flex-1 flex-col gap-6"
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
            <ItinerarySidebarNav
              activeBlockId={activeBlockId}
              blocks={blocks}
              collapsed={collapsed}
              onSelectBlock={handleSelectBlock}
            />
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
                Demo workspace
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Plan routes, dates, and map stops from one place.
              </p>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

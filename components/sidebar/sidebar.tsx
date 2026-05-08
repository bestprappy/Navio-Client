"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAtom } from "jotai";
import {
  BookOpenText,
  ClipboardList,
  Compass,
  Home,
  Map,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Zap,
} from "lucide-react";

import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import useSidebar from "@/hooks/useSidebar";
import { sidebarCollapsedAtom } from "@/app/configs/constant";

import SidebarItem from "./sidebar.item";
import SidebarMenu from "./sidebar.menu";

export default function SidebarWrapper() {
  const { activeSidebar, setActiveSidebar } = useSidebar();
  const [collapsed, setCollapsed] = useAtom(sidebarCollapsedAtom);
  const pathName = usePathname();

  useEffect(() => {
    setActiveSidebar(pathName);
  }, [pathName, setActiveSidebar]);

  const isRouteActive = (route: string) => {
    if (route === "/") return activeSidebar === "/";
    return activeSidebar === route || activeSidebar.startsWith(`${route}/`);
  };

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
            title="Planner"
            href="/planner"
            icon={<Map className="size-5" />}
            isActive={isRouteActive("/planner")}
            collapsed={collapsed}
          />
          <SidebarItem
            title="Guides"
            href="/guides/new"
            icon={<BookOpenText className="size-5" />}
            isActive={isRouteActive("/guides")}
            collapsed={collapsed}
          />
        </SidebarMenu>

        <SidebarMenu title="EV Tools" collapsed={collapsed}>
          <SidebarItem
            title="Charging"
            href="/charging"
            icon={<Zap className="size-5" />}
            isActive={isRouteActive("/charging")}
            collapsed={collapsed}
          />
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

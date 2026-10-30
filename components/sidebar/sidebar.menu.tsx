"use client";

import type { ReactNode } from "react";
import {
  CircleHelp,
  Compass,
  House,
  LayoutDashboard,
  MessageCircle,
} from "lucide-react";

import SidebarItem from "./sidebar.item";

type SidebarMenuProps = {
  title: string;
  children: ReactNode;
  collapsed?: boolean;
};

export default function SidebarMenu({
  title,
  children,
  collapsed = false,
}: SidebarMenuProps) {
  return (
    <div className="flex flex-col gap-2">
      {!collapsed && (
        <h3 className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

type PlannerDiscoverMenuProps = {
  collapsed: boolean;
  pathName: string;
  onNavigate: () => void;
};

export function PlannerDiscoverMenu({
  collapsed,
  pathName,
  onNavigate,
}: PlannerDiscoverMenuProps) {
  const isRouteActive = (route: string) =>
    pathName === route || (route !== "/" && pathName.startsWith(`${route}/`));

  return (
    <SidebarMenu title="Discover" collapsed={collapsed}>
      <SidebarItem
        title="Home"
        href="/"
        icon={<House className="size-5" />}
        isActive={pathName === "/"}
        onClick={onNavigate}
        collapsed={collapsed}
      />
      <SidebarItem
        title="Dashboard"
        href="/dashboard"
        icon={<LayoutDashboard className="size-5" />}
        isActive={isRouteActive("/dashboard")}
        onClick={onNavigate}
        collapsed={collapsed}
      />
      <SidebarItem
        title="Explore"
        href="/explore"
        icon={<Compass className="size-5" />}
        isActive={isRouteActive("/explore")}
        onClick={onNavigate}
        collapsed={collapsed}
      />
      <SidebarItem
        title="Community"
        href="/community"
        icon={<MessageCircle className="size-5" />}
        isActive={isRouteActive("/community")}
        onClick={onNavigate}
        collapsed={collapsed}
      />
      <SidebarItem
        title="Help"
        href="/help"
        icon={<CircleHelp className="size-5" />}
        isActive={isRouteActive("/help")}
        onClick={onNavigate}
        collapsed={collapsed}
      />
    </SidebarMenu>
  );
}

type SidebarTripsMenuProps = {
  children: ReactNode;
  collapsed: boolean;
};

export function SidebarTripsMenu({
  children,
  collapsed,
}: SidebarTripsMenuProps) {
  return (
    <SidebarMenu title="Trips" collapsed={collapsed}>
      {children}
    </SidebarMenu>
  );
}

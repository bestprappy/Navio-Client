"use client";

import { usePathname } from "next/navigation";
import { Compass, Home, Map, TrendingUp } from "lucide-react";

import SidebarItem from "@/components/sidebar/sidebar.item";
import SidebarMenu from "@/components/sidebar/sidebar.menu";

const COMMUNITY_NAV = [
  { title: "Home", href: "/community", icon: Home },
  { title: "Popular", href: "/community/popular", icon: TrendingUp },
  { title: "Explore", href: "/community/explore", icon: Compass },
  { title: "Planner", href: "/planner", icon: Map },
] as const;

export function CommunitySidebar() {
  const pathname = usePathname();

  const isRouteActive = (href: string) => {
    if (href === "/community") return pathname === "/community";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="hidden w-52 shrink-0 flex-col overflow-y-auto border-r border-border bg-card md:flex">
      <nav
        aria-label="Community navigation"
        className="flex min-h-max flex-1 flex-col px-3 py-4"
      >
        <SidebarMenu title="Community" collapsed={false}>
          {COMMUNITY_NAV.map(({ title, href, icon: Icon }) => (
            <SidebarItem
              key={href}
              title={title}
              href={href}
              icon={<Icon className="size-5" />}
              isActive={isRouteActive(href)}
              collapsed={false}
            />
          ))}
        </SidebarMenu>
      </nav>
    </aside>
  );
}

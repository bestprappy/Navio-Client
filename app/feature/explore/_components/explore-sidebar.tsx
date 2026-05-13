"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  HelpCircle,
  Home,
  Map,
  Settings,
  UserCircle,
  Users,
} from "lucide-react";

import { Logo } from "@/components/logo";
import SidebarItem from "@/components/sidebar/sidebar.item";
import SidebarMenu from "@/components/sidebar/sidebar.menu";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV_ITEMS = [
  { title: "Home", href: "/", icon: <Home className="size-5" /> },
  { title: "Explore", href: "/explore", icon: <Compass className="size-5" /> },
  {
    title: "Planner",
    href: "/planner",
    icon: <Map className="size-5" />,
  },
  { title: "Community", href: "/commu", icon: <Users className="size-5" /> },
  { title: "Help", href: "/help", icon: <HelpCircle className="size-5" /> },
  {
    title: "Settings",
    href: "/settings",
    icon: <Settings className="size-5" />,
  },
] as const;

export function ExploreSidebar() {
  const pathname = usePathname();

  const isRouteActive = (route: string) => {
    if (route === "/") return pathname === "/";
    return pathname === route || pathname.startsWith(`${route}/`);
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card px-3 py-4 shadow-sm md:flex">
      <div className="flex items-center gap-3 px-3 py-2">
        <Logo className="size-8 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-foreground">Navio</p>
          <p className="text-xs text-muted-foreground">EV trip planner</p>
        </div>
      </div>

      <Link
        href="/profile"
        className="mt-6 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
      >
        <UserCircle className="size-6 text-primary" />
        <span className="truncate">Kanya S.</span>
      </Link>

      <nav
        aria-label="Explore navigation"
        className="mt-6 flex flex-1 flex-col"
      >
        <SidebarMenu title="Navigation">
          {NAV_ITEMS.map((item) => (
            <SidebarItem
              key={item.title}
              title={item.title}
              href={item.href}
              icon={item.icon}
              isActive={false}
            />
          ))}
        </SidebarMenu>
      </nav>

      <div className="mt-6">
        <ThemeToggle showLabel className="w-full justify-start px-3" />
      </div>
    </aside>
  );
}

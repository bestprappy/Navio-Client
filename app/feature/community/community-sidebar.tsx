"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Compass,
  Home,
  Map,
  Search,
  TrendingUp,
} from "lucide-react";

import SidebarItem from "@/components/sidebar/sidebar.item";
import SidebarMenu from "@/components/sidebar/sidebar.menu";
import { LAST_NON_COMMUNITY_PATH_KEY } from "@/components/navigation-history";

const COMMUNITY_NAV = [
  { title: "Feed", href: "/community", icon: Home },
  { title: "Popular", href: "/community/popular", icon: TrendingUp },
  { title: "Discover groups", href: "/community/discovery", icon: Compass },
] as const;

const APP_NAV = [
  { title: "Home", href: "/", icon: Home },
  { title: "Planner", href: "/planner", icon: Map },
  { title: "Explore", href: "/explore", icon: Search },
] as const;

export function CommunitySidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleGoBack = useCallback(() => {
    if (typeof window === "undefined") return;

    const lastPath = window.sessionStorage.getItem(LAST_NON_COMMUNITY_PATH_KEY);

    if (lastPath && !lastPath.startsWith("/community")) {
      router.push(lastPath);
      return;
    }

    router.push("/");
  }, [router]);

  const isRouteActive = (href: string) => {
    if (href !== "/community") {
      return pathname === href || pathname.startsWith(`${href}/`);
    }

    if (pathname === "/community") return true;
    if (!pathname.startsWith("/community/")) return false;

    return !COMMUNITY_NAV.some(
      (nav) =>
        nav.href !== "/community" &&
        (pathname === nav.href || pathname.startsWith(`${nav.href}/`)),
    );
  };

  return (
    <aside className="hidden min-h-0 w-48 shrink-0 flex-col overflow-y-auto overscroll-y-contain border-r border-border/60 bg-card/60 md:flex xl:w-56 [scrollbar-width:thin]">
      <nav
        aria-label="Community navigation"
        className="flex min-h-max flex-1 flex-col px-3 py-4"
      >
        <button
          type="button"
          onClick={handleGoBack}
          className="mb-4 flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
        >
          <span className="flex size-5 shrink-0 items-center justify-center text-muted-foreground">
            <ArrowLeft className="size-5" />
          </span>
          <span className="min-w-0 flex-1 truncate text-left">Back to Navio</span>
        </button>
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

        <div className="my-3 " />

        <SidebarMenu title="Navigate" collapsed={false}>
          {APP_NAV.map(({ title, href, icon: Icon }) => (
            <SidebarItem
              key={href}
              title={title}
              href={href}
              icon={<Icon className="size-5" />}
              isActive={false}
              collapsed={false}
            />
          ))}
        </SidebarMenu>
      </nav>
    </aside>
  );
}

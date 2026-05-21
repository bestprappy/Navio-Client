"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Compass, Home, TrendingUp } from "lucide-react";

import SidebarItem from "@/components/sidebar/sidebar.item";
import SidebarMenu from "@/components/sidebar/sidebar.menu";
import { LAST_NON_COMMUNITY_PATH_KEY } from "@/components/navigation-history";

const COMMUNITY_NAV = [
  { title: "Feed", href: "/community", icon: Home },
  { title: "Popular", href: "/community/popular", icon: TrendingUp },
  { title: "Discovery", href: "/community/discovery", icon: Compass },
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
    <aside className="hidden w-52 shrink-0 flex-col overflow-y-auto border-r border-border  md:flex">
      <nav
        aria-label="Community navigation"
        className="flex min-h-max flex-1 flex-col px-3 py-4"
      >
        <button
          type="button"
          onClick={handleGoBack}
          className="mb-4 flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
        >
          <span className="flex size-5 shrink-0 items-center justify-center text-muted-foreground">
            <ArrowLeft className="size-5" />
          </span>
          <span className="min-w-0 flex-1 truncate text-left">Go Back</span>
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
      </nav>
    </aside>
  );
}

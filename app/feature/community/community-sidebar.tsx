"use client";

import { useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSetAtom } from "jotai";
import { ArrowLeft, Compass, Flame, Home, Plus } from "lucide-react";

import { LAST_NON_COMMUNITY_PATH_KEY } from "@/components/navigation-history";
import { Skeleton } from "@/components/ui/skeleton";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { cn } from "@/lib/utils";
import { createCommunityOpenAtom } from "./_components/community-atoms";
import { useCommunityGroups, useCommunityIdentity } from "./_components/community-group-queries";
import { CommunityIcon, communityHandle } from "./_components/community-identity";

export const COMMUNITY_NAV = [
  { title: "Home", href: "/community", icon: Home },
  { title: "Popular", href: "/community/popular", icon: Flame },
  { title: "Explore", href: "/community/discovery", icon: Compass },
] as const;

/** Which top-level feed a path belongs to; community and post pages highlight nothing. */
export function isCommunityNavActive(pathname: string, href: string) {
  if (href === "/community") return pathname === "/community";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const ROW =
  "flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function CommunitySidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const openCreate = useSetAtom(createCommunityOpenAtom);
  const { requireAuth } = useRequireAuth();
  const { authenticated } = useCommunityIdentity();
  const mine = useCommunityGroups("", true);

  const handleGoBack = useCallback(() => {
    const lastPath = window.sessionStorage.getItem(LAST_NON_COMMUNITY_PATH_KEY);
    router.push(lastPath && !lastPath.startsWith("/community") ? lastPath : "/");
  }, [router]);

  return (
    <aside className="hidden min-h-0 w-64 shrink-0 flex-col overflow-y-auto overscroll-y-contain border-r border-sidebar-border bg-sidebar md:flex">
      <nav aria-label="Community navigation" className="flex min-h-max flex-1 flex-col gap-1 px-3 py-4">
        {COMMUNITY_NAV.map(({ title, href, icon: Icon }) => {
          const active = isCommunityNavActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                ROW,
                active
                  ? "bg-sidebar-accent font-semibold text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className={cn("size-5", active && "text-primary")} aria-hidden="true" />
              {title}
            </Link>
          );
        })}

        <div className="my-3 h-px bg-sidebar-border" />

        <h2 className="px-3 pb-1 text-xs font-semibold text-muted-foreground">Your communities</h2>
        <button
          type="button"
          onClick={() => requireAuth(() => openCreate(true))}
          className={cn(ROW, "text-foreground hover:bg-muted")}
        >
          <span className="flex size-6 items-center justify-center rounded-full bg-primary/12 text-primary">
            <Plus className="size-4" aria-hidden="true" />
          </span>
          Create a community
        </button>

        {authenticated && mine.isLoading ? (
          <div className="flex flex-col gap-2 px-3 py-1" role="status">
            <span className="sr-only">Loading your communities</span>
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="h-6 w-full rounded-full" />
            ))}
          </div>
        ) : null}
        {mine.isError ? (
          <p className="px-3 py-1 text-xs text-muted-foreground">
            Your communities could not load.{" "}
            <button type="button" className="font-semibold text-primary underline" onClick={() => void mine.refetch()}>
              Try again
            </button>
          </p>
        ) : null}
        {authenticated && !mine.isLoading && !mine.isError && mine.data.length === 0 ? (
          <p className="px-3 py-1 text-xs leading-5 text-muted-foreground">
            Communities you join appear here.
          </p>
        ) : null}

        <ul className="flex flex-col gap-0.5">
          {mine.data.map((group) => {
            const href = `/community/${group.slug}`;
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={group.id}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    ROW,
                    "min-h-9",
                    active ? "bg-sidebar-accent text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <CommunityIcon name={group.name} seed={group.slug ?? group.id} src={group.avatarUrl} size="sm" />
                  <span className="truncate">{communityHandle(group.slug, group.name)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        {mine.hasNextPage ? (
          <button
            type="button"
            disabled={mine.isFetchingNextPage}
            onClick={() => void mine.fetchNextPage()}
            className="px-3 py-1 text-left text-xs font-semibold text-primary hover:underline"
          >
            Show more
          </button>
        ) : null}

        <div className="mt-auto pt-4">
          <button type="button" onClick={handleGoBack} className={cn(ROW, "text-muted-foreground hover:bg-muted hover:text-foreground")}>
            <ArrowLeft className="size-5" aria-hidden="true" />
            Back to Navio
          </button>
        </div>
      </nav>
    </aside>
  );
}

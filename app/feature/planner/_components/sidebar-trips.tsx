"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

import SidebarMenu from "@/components/sidebar/sidebar.menu";
import { Button } from "@/components/ui/button";
import { CountryFlag } from "@/components/ui/country-flag";
import { cn } from "@/lib/utils";
import { listTrips } from "./planner-api";
import { buildTripHref, getTripDayCount, parseTripDate } from "./dashboard/trip-dashboard.utils";

export function SidebarTrips({ collapsed, onNavigate }: { collapsed: boolean; onNavigate: () => void }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const trips = useQuery({
    queryKey: ["planner", "trips", { page: 0, size: 30, userId: session?.user?.id }],
    queryFn: () => listTrips(0, 30),
    enabled: status === "authenticated",
    staleTime: 30_000,
    retry: 1,
  });
  const items = trips.data?.content.slice(0, 4) ?? [];

  return (
    <SidebarMenu title="Trips" collapsed={collapsed}>
      {status === "loading" || (status === "authenticated" && trips.isPending) ? (
        <div role="status" aria-label="Loading trips" className="h-20 animate-pulse rounded-xl bg-muted" />
      ) : trips.isError && status === "authenticated" ? (
        <div className="rounded-xl bg-muted/50 p-2 text-xs text-muted-foreground">
          {!collapsed && <p>Could not load trips.</p>}
          <Button variant="ghost" size="sm" disabled={trips.isFetching} onClick={() => void trips.refetch()}>Retry</Button>
        </div>
      ) : status !== "authenticated" || !items.length ? (
        !collapsed && <p className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
          {status === "authenticated" ? "Your saved trips will appear here." : "Sign in to see your saved trips."}
        </p>
      ) : (
        <div className="flex flex-col gap-1 rounded-xl bg-background p-1 shadow-2xs">
          {items.map((trip) => {
            const active = pathname === `/planner/${trip.id}`;
            const start = parseTripDate(trip.startDate);
            const days = getTripDayCount(trip);
            const title = trip.title || "Untitled trip";
            return (
              <Link key={trip.id} href={buildTripHref(trip)} onClick={onNavigate} title={title} aria-label={title} aria-current={active ? "page" : undefined}
                className={cn("flex min-h-11 min-w-0 items-center gap-2 rounded-lg p-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", collapsed && "justify-center", active && "bg-secondary text-secondary-foreground")}>
                <CountryFlag code={trip.destinationCountryCode} />
                {!collapsed && <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold">{title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{days} {days === 1 ? "day" : "days"}{start ? `, ${format(start, "d MMM yyyy")}` : " · Dates not set"}</span>
                </span>}
              </Link>
            );
          })}
          {!collapsed && (trips.data?.totalElements ?? 0) > 4 && <Link href="/dashboard" onClick={onNavigate} className="rounded-lg px-2 py-2 text-xs font-medium text-primary hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">View all trips</Link>}
        </div>
      )}
    </SidebarMenu>
  );
}

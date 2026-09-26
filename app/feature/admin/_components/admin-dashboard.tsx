"use client";

import Link from "next/link";
import { useId } from "react";
import { useRouter } from "next/navigation";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { RotateCw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button.variants";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { type AdminUserSummary, type UserStatus } from "./admin-api";
import { formatAdminDate, formatAdminDateTime, formatAdminRelative } from "./admin-format";
import { AdminErrorState, AdminLoadingRows } from "./admin-query-state";
import { adminQueryKeys, useAdminStatistics, useAdminUserSample } from "./admin-queries";
import { adminUsersHref } from "./admin-users-url";
import { AccountCountStrip } from "./account-count-strip";
import { UserStatusLabel } from "./user-status-label";
import { isAdministrator } from "@/lib/navio-roles";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { catalogKeys, listAdminCatalog } from "./catalog/catalog-api";
import { activityKeys, listActivity } from "./activity/activity-api";
import { ActivityRow } from "./activity/activity-workspace";

const SAMPLE_SIZE = 5;

export function AdminDashboard() {
  const { data: session } = useSession();
  const administrator = isAdministrator(session?.user?.roles);
  const statistics = useAdminStatistics();
  const queryClient = useQueryClient();
  const isRefreshing = useIsFetching({ queryKey: adminQueryKeys.root }) > 0;

  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="admin-accounts-heading" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 id="admin-accounts-heading" className="text-lg font-semibold">Accounts</h2>
            {statistics.data ? (
              <p className="text-sm text-muted-foreground">
                Counted at <time dateTime={statistics.data.asOf}>{formatAdminDateTime(statistics.data.asOf)}</time>.
                Deleted accounts are not included.
              </p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: adminQueryKeys.root })}
              disabled={isRefreshing}
              aria-label="Refresh overview"
            >
              <RotateCw className={cn(isRefreshing && "animate-spin motion-reduce:animate-none")} aria-hidden="true" />
              Refresh
            </Button>
            <Link href="/admin/users" className={buttonVariants({ variant: "outline", size: "sm" })}>
              View all users
            </Link>
          </div>
        </div>

        {statistics.isPending ? (
          <Skeleton className="h-28 w-full rounded-xl" role="status" aria-label="Loading counts" />
        ) : statistics.isError ? (
          <AdminErrorState error={statistics.error} onRetry={() => statistics.refetch()} isRetrying={statistics.isFetching} />
        ) : (
          <AccountCountStrip.Root label="Account counts">
            <AccountCountStrip.Item value={statistics.data.totalUsers} label="Accounts" hint="Excluding deleted accounts" />
            <AccountCountStrip.Item
              href={adminUsersHref({ status: "active" })}
              value={statistics.data.activeUsers}
              label="Active"
              hint="Allowed to sign in"
            />
            <AccountCountStrip.Item
              href={adminUsersHref({ status: "suspended" })}
              value={statistics.data.suspendedUsers}
              label="Banned"
              tone="destructive"
              hint="Sign-in blocked"
            />
            <AccountCountStrip.Item
              value={statistics.data.joinedLast30Days}
              label="Joined in 30 days"
              hint={`Since ${formatAdminDate(statistics.data.joinedSince)}`}
            />
          </AccountCountStrip.Root>
        )}
      </section>

      <AccountSearch />

      {administrator && <AdminOperations />}

      <div className="grid gap-10 lg:grid-cols-2">
        <AccountSample
          title="Newest accounts"
          status={null}
          empty="No one has signed in yet."
          seeAllHref={adminUsersHref({})}
          describe={(user) => `Joined ${formatAdminRelative(user.createdAt)}`}
        />
        <AccountSample
          title="Banned accounts"
          status="suspended"
          empty="No accounts are banned."
          seeAllHref={adminUsersHref({ status: "suspended" })}
          describe={(user) => user.email}
        />
      </div>
    </div>
  );
}

function AdminOperations() {
  const catalog = useQuery({ queryKey: [...catalogKeys.root, "summary", "PUBLISHED"], queryFn: () => listAdminCatalog("", "PUBLISHED", 0), retry: false });
  const drafts = useQuery({ queryKey: [...catalogKeys.root, "summary", "DRAFT"], queryFn: () => listAdminCatalog("", "DRAFT", 0), retry: false });
  const activity = useQuery({ queryKey: [...activityKeys.root, "recent"], queryFn: () => listActivity({ action: "", resourceType: "", actorId: "", from: "", to: "", page: 0, size: 5 }), retry: false });
  return <section aria-labelledby="admin-operations-heading" className="grid gap-6 lg:grid-cols-2">
    <div className="rounded-xl border bg-card p-5"><div className="flex items-center justify-between gap-3"><h2 id="admin-operations-heading" className="text-lg font-semibold">Vehicle catalog</h2><Link href="/admin/vehicles" className="text-sm font-medium text-primary underline-offset-4 hover:underline">Manage vehicles</Link></div>
      <p className="mt-1 text-sm text-muted-foreground">Published specifications are available to drivers and guests.</p>
      <div className="mt-5 grid grid-cols-2 gap-4"><div><p className="text-3xl font-semibold tabular-nums">{catalog.data?.totalElements ?? "—"}</p><p className="text-sm text-muted-foreground">Published</p></div><div><p className="text-3xl font-semibold tabular-nums">{drafts.data?.totalElements ?? "—"}</p><p className="text-sm text-muted-foreground">Drafts</p></div></div>
      {(catalog.isError || drafts.isError) && <p className="mt-3 text-sm text-destructive">Catalog counts are unavailable. Open the catalog to retry.</p>}
    </div>
    <div className="rounded-xl border bg-card p-5"><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">Recent activity</h2><Link href="/admin/activity" className="text-sm font-medium text-primary underline-offset-4 hover:underline">View activity</Link></div>
      {activity.isPending ? <p role="status" className="mt-4 text-sm text-muted-foreground">Loading activity…</p> : activity.isError ? <p className="mt-4 text-sm text-destructive">Activity is unavailable.</p> : activity.data.content.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No activity yet.</p> : <ol className="mt-3 -mx-5 divide-y">{activity.data.content.map((entry) => <ActivityRow key={entry.id} entry={entry} />)}</ol>}
    </div>
  </section>;
}

type AccountSampleProps = {
  title: string;
  status: UserStatus | null;
  empty: string;
  seeAllHref: string;
  describe: (user: AdminUserSummary) => string;
};

function AccountSample({ title, status, empty, seeAllHref, describe }: AccountSampleProps) {
  const sample = useAdminUserSample(status, SAMPLE_SIZE);
  const headingId = `admin-sample-${status ?? "all"}`;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={headingId} className="text-lg font-semibold">{title}</h2>
        {sample.data && sample.data.totalElements > 0 ? (
          <Link href={seeAllHref} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
            View all
          </Link>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        {status === null ? "Most recently joined, including deleted accounts." : "Banned accounts, newest sign-ups first."}
      </p>
      {sample.isPending ? (
        <AdminLoadingRows rows={3} label={`Loading ${title.toLowerCase()}`} />
      ) : sample.isError ? (
        <AdminErrorState error={sample.error} onRetry={() => sample.refetch()} isRetrying={sample.isFetching} />
      ) : sample.data.content.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
          {sample.data.content.map((user) => (
            <li key={user.id}>
              <Link
                href={adminUsersHref({ status, userId: user.id })}
                className="flex items-center justify-between gap-3 px-4 py-3 outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">{user.displayName}</span>
                  {status === null ? <span className="truncate text-xs text-muted-foreground">{user.email}</span> : null}
                  <span className="truncate text-xs text-muted-foreground">{describe(user)}</span>
                </span>
                {status === null ? <UserStatusLabel status={user.status} className="shrink-0" /> : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AccountSearch() {
  const router = useRouter();
  const searchId = useId();

  return (
    <form
      role="search"
      aria-label="Find an account"
      className="flex flex-col gap-4 rounded-xl bg-muted/60 p-5 sm:flex-row sm:items-end sm:justify-between"
      onSubmit={(event) => {
        event.preventDefault();
        const term = new FormData(event.currentTarget).get("q");
        router.push(adminUsersHref({ term: typeof term === "string" ? term : "" }));
      }}
    >
      <div className="flex flex-col gap-1">
        <label htmlFor={searchId} className="font-semibold">Find an account</label>
        <p className="text-sm text-muted-foreground">Review details and moderation history.</p>
      </div>
      <div className="flex min-w-0 flex-1 gap-2 sm:max-w-sm">
        <Input id={searchId} name="q" type="search" placeholder="Name or email" maxLength={200} autoComplete="off" className="h-10 min-w-0 bg-card" />
        <Button type="submit" variant="secondary" className="h-10">
          <Search aria-hidden="true" />
          Search
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { ADMIN_PAGE_SIZE, userStatusLabel } from "./admin-api";
import { formatCount } from "./admin-format";
import { AdminErrorState, AdminLoadingRows } from "./admin-query-state";
import { useAdminUserSearch } from "./admin-queries";
import { AdminUserDrawer } from "./admin-user-drawer";
import { AdminUsersTable } from "./admin-users-table";
import { adminUsersHref, readAdminUsersView, STATUS_FILTERS, type AdminUsersView } from "./admin-users-url";

const SEARCH_DEBOUNCE_MS = 300;

type AdminUsersWorkspaceProps = {
  viewerIsAdmin: boolean;
};

export function AdminUsersWorkspace({ viewerIsAdmin }: AdminUsersWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = useMemo(() => readAdminUsersView(searchParams), [searchParams]);
  const searchId = useId();

  const navigate = useCallback(
    (next: Partial<AdminUsersView>) => {
      if (pathname !== "/admin/users") return;
      router.replace(adminUsersHref({ ...view, ...next }), { scroll: false });
    },
    [pathname, router, view],
  );

  // The box updates as you type; the URL (and the request) follows after a
  // pause. Back/forward changes the URL first, and the box follows it.
  const [draft, setDraft] = useState(view.term);
  const [lastUrlTerm, setLastUrlTerm] = useState(view.term);
  if (lastUrlTerm !== view.term) {
    setLastUrlTerm(view.term);
    setDraft(view.term);
  }
  useEffect(() => {
    if (draft.trim() === view.term.trim()) return;
    const timer = window.setTimeout(() => navigate({ term: draft, page: 0, userId: null }), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [draft, navigate, view.term]);

  const search = useMemo(() => ({ term: view.term, status: view.status, page: view.page }), [view.term, view.status, view.page]);
  const users = useAdminUserSearch(search);
  const openUser = useCallback((userId: string) => navigate({ userId }), [navigate]);
  const closeUser = useCallback(() => navigate({ userId: null }), [navigate]);

  const filterDescription = [
    view.status ? `${userStatusLabel(view.status).toLowerCase()} accounts` : "all accounts",
    view.term ? `matching “${view.term}”` : null,
  ].filter(Boolean).join(" ");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex w-full max-w-md flex-col gap-1.5">
          <label htmlFor={searchId} className="text-sm font-medium">Find an account</label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id={searchId}
              type="search"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Name or email"
              maxLength={200}
              autoComplete="off"
              className="h-10 pl-9"
            />
          </div>
        </div>
        <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
          {STATUS_FILTERS.map((filter) => {
            const active = filter.value === view.status;
            return (
              <button
                key={filter.label}
                type="button"
                aria-pressed={active}
                onClick={() => navigate({ status: filter.value, page: 0, userId: null })}
                className={cn(
                  "min-h-9 rounded-md px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      <section aria-labelledby={`${searchId}-results`} className="flex flex-col gap-3">
        <h2 id={`${searchId}-results`} className="sr-only">Accounts</h2>
        {users.isPending ? (
          <AdminLoadingRows rows={6} label="Loading accounts" />
        ) : users.isError ? (
          <AdminErrorState error={users.error} onRetry={() => users.refetch()} isRetrying={users.isFetching} />
        ) : users.data.content.length === 0 && view.page > 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-border p-6">
            <p className="text-sm font-medium">This page has no accounts.</p>
            <p className="text-sm text-muted-foreground">The list is shorter than this link expects.</p>
            <Button variant="outline" size="sm" onClick={() => navigate({ page: 0 })}>Go to the first page</Button>
          </div>
        ) : users.data.content.length === 0 ? (
          <EmptyResults hasFilters={Boolean(view.term || view.status)} onClear={() => navigate({ term: "", status: null, page: 0 })} />
        ) : (
          <>
            <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
              {resultSummary(users.data.number, users.data.content.length, users.data.totalElements)}
              {users.isFetching ? " (updating)" : ""}
            </p>
            <div className={cn("transition-opacity", users.isPlaceholderData && "opacity-60")}>
              <AdminUsersTable
                users={users.data.content}
                selectedUserId={view.userId}
                onOpenUser={openUser}
                caption={`Accounts: ${filterDescription}`}
              />
            </div>
            <Pagination
              page={users.data.number}
              totalPages={users.data.totalPages}
              onPage={(page) => navigate({ page })}
            />
          </>
        )}
      </section>

      <AdminUserDrawer userId={view.userId} viewerIsAdmin={viewerIsAdmin} onClose={closeUser} />
    </div>
  );
}

function resultSummary(page: number, count: number, total: number): string {
  const first = page * ADMIN_PAGE_SIZE + 1;
  return `Showing ${formatCount(first)}–${formatCount(first + count - 1)} of ${formatCount(total)} accounts`;
}

function EmptyResults({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-border p-6">
      <p className="text-sm font-medium">{hasFilters ? "No accounts match." : "No accounts yet."}</p>
      <p className="text-sm text-muted-foreground">
        {hasFilters
          ? "Check the spelling, or search by the email address the person signed up with."
          : "Accounts appear here after someone signs in to Navio for the first time."}
      </p>
      {hasFilters ? <Button variant="outline" size="sm" onClick={onClear}>Clear search and filter</Button> : null}
    </div>
  );
}

type PaginationProps = {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
};

function Pagination({ page, totalPages, onPage }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pages" className="flex items-center justify-between gap-3 pt-2">
      <Button variant="outline" size="sm" onClick={() => onPage(page - 1)} disabled={page === 0}>
        <ChevronLeft aria-hidden="true" />
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
      <Button variant="outline" size="sm" onClick={() => onPage(page + 1)} disabled={page + 1 >= totalPages}>
        Next
        <ChevronRight aria-hidden="true" />
      </Button>
    </nav>
  );
}

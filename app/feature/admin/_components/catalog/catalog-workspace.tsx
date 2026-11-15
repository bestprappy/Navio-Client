"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button.variants";
import { cn } from "@/lib/utils";
import { AdminLoadingRows, AdminErrorState } from "../admin-query-state";
import { formatCount } from "../admin-format";
import { CATALOG_STATUSES, catalogKeys, listAdminCatalog } from "./catalog-api";
import { CatalogSearch } from "./catalog-search";
import { CatalogStatusFilter } from "./catalog-status-filter";
import { statusTone, type CatalogStatusFilter as StatusFilterValue } from "./catalog-status";
import { CatalogTransitionDialog } from "./catalog-transition-dialog";
import { CATALOG_ROW_GRID, CatalogVehicleRow, type CatalogTransition } from "./catalog-vehicle-row";

export function CatalogWorkspace() {
  const params = useSearchParams();
  const router = useRouter();
  const term = (params.get("q") ?? "").slice(0, 100);
  const status = CATALOG_STATUSES.find((value) => value === params.get("status")) ?? null;
  const rawPage = Number(params.get("page") ?? "1");
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 && rawPage < 2_147_483_647 ? rawPage - 1 : 0;
  const query = useQuery({
    queryKey: [...catalogKeys.root, "list", term, status, page],
    queryFn: () => listAdminCatalog(term, status, page),
    placeholderData: keepPreviousData, staleTime: 0, retry: false,
  });
  const [transition, setTransition] = useState<CatalogTransition | null>(null);
  const [notice, setNotice] = useState("");

  const navigate = useCallback((changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) { if (value) next.set(key, value); else next.delete(key); }
    router.replace(`/admin/vehicles?${next}`, { scroll: false });
  }, [params, router]);
  const onSearch = useCallback((value: string) => navigate({ q: value, page: "" }), [navigate]);
  const onStatus = useCallback((value: StatusFilterValue) => navigate({ status: value ?? "", page: "" }), [navigate]);
  const tone = statusTone(status);

  return <div className="flex flex-col gap-6">
    <CatalogStatusFilter term={term} value={status} onChange={onStatus} />

    <section aria-labelledby="catalog-list-heading" className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <h2 id="catalog-list-heading" className="flex items-center gap-2 text-sm font-semibold">
          <span aria-hidden="true" className={cn("size-2 rounded-full", tone.dot)} />
          {tone.plural}
          {query.isSuccess && <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">{formatCount(query.data.totalElements)}</span>}
        </h2>
        <CatalogSearch term={term} onSearch={onSearch} />
      </div>
      <p role="status" className="sr-only">{notice || (query.isFetching ? "Updating vehicle list" : "")}</p>
      {notice && <p className="border-b border-border bg-success/10 px-5 py-2 text-sm text-success">{notice}</p>}

      {query.isPending ? <div className="p-4"><AdminLoadingRows rows={5} label="Loading vehicle catalog" /></div>
        : query.isError ? <div className="p-4"><AdminErrorState error={query.error} onRetry={() => query.refetch()} isRetrying={query.isFetching} /></div>
        : query.data.content.length === 0 ? <EmptyState filtered={Boolean(term || status)} onClear={() => navigate({ q: "", status: "", page: "" })} />
        : <>
          <div aria-hidden="true" className={cn("hidden border-b border-border bg-muted/30 px-5 py-2 text-xs font-medium text-muted-foreground", CATALOG_ROW_GRID)}>
            <span>Vehicle</span><span>Battery</span><span>Range</span><span>Charging</span><span>Status</span><span />
          </div>
          <ul aria-label="Vehicles" aria-busy={query.isFetching} className={cn("divide-y divide-border transition-opacity", query.isPlaceholderData && "opacity-60")}>
            {query.data.content.map((entry) => <CatalogVehicleRow key={entry.id} entry={entry} onTransition={setTransition} />)}
          </ul>
        </>}

      {query.isSuccess && (query.data.totalPages > 1 || page > 0) && <nav aria-label="Catalog pages" className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-5">
        <span className="text-sm text-muted-foreground">Page {page + 1} of {Math.max(query.data.totalPages, page + 1)}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => navigate({ page: String(page) })}><ChevronLeft aria-hidden="true" />Previous</Button>
          <Button variant="outline" size="sm" disabled={page + 1 >= query.data.totalPages} onClick={() => navigate({ page: String(page + 2) })}>Next<ChevronRight aria-hidden="true" /></Button>
        </div>
      </nav>}
    </section>

    <CatalogTransitionDialog transition={transition} onClose={() => setTransition(null)} onDone={setNotice} />
  </div>;
}

function EmptyState({ filtered, onClear }: { filtered: boolean; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary"><SearchX className="size-5" aria-hidden="true" /></span>
      <p className="font-medium">{filtered ? "No vehicles match this view" : "The catalog is empty"}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{filtered ? "Try another search or status, or clear the filters to see every vehicle." : "Add the first vehicle so drivers can choose it for their garage."}</p>
      {filtered
        ? <Button variant="outline" onClick={onClear}>Clear filters</Button>
        : <Link href="/admin/vehicles/new" className={buttonVariants()}><Plus aria-hidden="true" />Add vehicle</Link>}
    </div>
  );
}

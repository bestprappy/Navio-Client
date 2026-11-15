"use client";

import { useQueries } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { formatCount } from "../admin-format";
import { CATALOG_STATUSES, catalogKeys, listAdminCatalog } from "./catalog-api";
import { statusTone, type CatalogStatusFilter } from "./catalog-status";

const FILTERS: readonly CatalogStatusFilter[] = [null, ...CATALOG_STATUSES];

type CatalogStatusFilterProps = {
  term: string;
  value: CatalogStatusFilter;
  onChange: (value: CatalogStatusFilter) => void;
};

/**
 * The catalog overview and the status filter in one control: each segment is
 * a count for the current search and selecting it narrows the list. A failed
 * or pending count shows a dash, never a zero an admin could take as fact.
 */
export function CatalogStatusFilter({ term, value, onChange }: CatalogStatusFilterProps) {
  const counts = useQueries({
    queries: FILTERS.map((status) => ({
      queryKey: [...catalogKeys.root, "count", term, status],
      queryFn: () => listAdminCatalog(term, status, 0, 1),
      select: (page: { totalElements: number }) => page.totalElements,
      staleTime: 30_000,
      retry: false,
    })),
  });

  return (
    <div role="group" aria-label="Filter by publication status"
      className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border shadow-sm md:grid-cols-4">
      {FILTERS.map((status, index) => {
        const tone = statusTone(status);
        const selected = value === status;
        const count = counts[index];
        return (
          <button key={status ?? "all"} type="button" aria-pressed={selected} onClick={() => onChange(status)}
            className={cn(
              "group relative flex flex-col items-start gap-1 px-5 py-4 text-left outline-none transition-colors",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
              selected ? "bg-card" : "bg-muted/40 hover:bg-muted/70",
            )}>
            <span aria-hidden="true" className={cn("absolute inset-x-0 top-0 h-0.75 transition-opacity", tone.bar, selected ? "opacity-100" : "opacity-0 group-hover:opacity-40")} />
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              <span aria-hidden="true" className={cn("size-2 rounded-full", tone.dot)} />
              {tone.plural}
            </span>
            <span className={cn("text-3xl font-semibold leading-none tabular-nums", selected ? tone.text : "text-foreground")}>
              {count.isSuccess ? formatCount(count.data) : <span aria-label={count.isError ? "Count unavailable" : "Loading count"}>–</span>}
            </span>
            <span className="text-xs text-muted-foreground">{term ? `Matching “${term}”` : tone.hint}</span>
          </button>
        );
      })}
    </div>
  );
}

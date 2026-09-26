"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button.variants";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CATALOG_STATUSES, catalogKeys, listAdminCatalog } from "./catalog-api";
import { AdminLoadingRows, AdminErrorState } from "../admin-query-state";

export function CatalogWorkspace() {
  const params = useSearchParams();
  const router = useRouter();
  const term = (params.get("q") ?? "").slice(0, 100);
  const status = CATALOG_STATUSES.find((value) => value === params.get("status")) ?? null;
  const rawPage = Number(params.get("page") ?? "1");
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 && rawPage < 2_147_483_647 ? rawPage - 1 : 0;
  const query = useQuery({ queryKey: [...catalogKeys.root, "list", term, status, page], queryFn: () => listAdminCatalog(term, status, page), staleTime: 0, retry: false });
  function navigate(changes: Record<string, string>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) { if (value) next.set(key, value); else next.delete(key); }
    router.replace(`/admin/vehicles?${next}`, { scroll: false });
  }
  return <div className="flex flex-col gap-5">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <form role="search" aria-label="Search vehicle catalog" className="flex w-full max-w-md items-end gap-2" onSubmit={(event) => {
        event.preventDefault(); navigate({ q: String(new FormData(event.currentTarget).get("q") ?? "").trim(), page: "" });
      }}>
        <div className="flex min-w-0 flex-1 flex-col gap-2"><label htmlFor="catalog-search" className="text-sm font-medium">Find a vehicle</label><Input key={term} id="catalog-search" name="q" defaultValue={term} maxLength={100} placeholder="Make, model or trim" type="search" /></div>
        <Button type="submit" variant="outline" aria-label="Search catalog"><Search aria-hidden="true" /></Button>
      </form>
      <Link href="/admin/vehicles/new" className={buttonVariants({ variant: "secondary" })}><Plus aria-hidden="true" />Add vehicle</Link>
    </div>
    <div role="group" aria-label="Publication status" className="flex flex-wrap gap-2">
      {([null, ...CATALOG_STATUSES] as const).map((value) => <Button key={value ?? "all"} variant={status === value ? "secondary" : "ghost"} aria-pressed={status === value} onClick={() => navigate({ status: value ?? "", page: "" })}>{value ? `${value[0]}${value.slice(1).toLowerCase()}` : "All"}</Button>)}
    </div>
    {query.isPending ? <AdminLoadingRows rows={5} label="Loading vehicle catalog" />
      : query.isError ? <AdminErrorState error={query.error} onRetry={() => query.refetch()} />
      : <>
        <p role="status" className="text-sm text-muted-foreground">{query.data.totalElements} vehicles{query.isFetching ? " · updating" : ""}</p>
        {query.data.content.length === 0 ? <div className="rounded-lg border border-dashed p-6"><p>No vehicles in this view.</p><Button variant="link" onClick={() => navigate({ q: "", status: "", page: "" })}>Clear filters</Button></div>
          : <div className="overflow-x-auto rounded-xl border bg-card"><table className="w-full text-left text-sm"><caption className="sr-only">Global vehicle catalog</caption>
            <thead className="border-b bg-muted/40 text-muted-foreground"><tr><th className="p-4 font-medium">Vehicle</th><th className="hidden p-4 font-medium md:table-cell">Specifications</th><th className="p-4 font-medium">Status</th><th className="p-4"><span className="sr-only">Edit</span></th></tr></thead>
            <tbody>{query.data.content.map((entry) => <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/30">
              <td className="p-4"><Link href={`/admin/vehicles/${entry.id}`} className="font-semibold underline-offset-4 hover:underline">{entry.specification.make} {entry.specification.model}</Link><p className="text-xs text-muted-foreground">{[entry.specification.trim, entry.specification.year, entry.specification.market].filter(Boolean).join(" · ")}</p></td>
              <td className="hidden p-4 text-muted-foreground md:table-cell">{entry.specification.batteryCapacityKwh === null ? "Battery not set" : `${entry.specification.batteryCapacityKwh} kWh`}<br />{entry.specification.rangeKm === null ? "Range not set" : `${entry.specification.rangeKm} km ${entry.specification.rangeStandard ?? ""}`}</td>
              <td className="p-4"><Badge variant={entry.status === "PUBLISHED" ? "secondary" : "outline"}>{entry.status[0]}{entry.status.slice(1).toLowerCase()}</Badge></td>
              <td className="p-4"><Link href={`/admin/vehicles/${entry.id}`} className="text-sm underline underline-offset-4" aria-label={`Edit ${entry.specification.make} ${entry.specification.model}`}>Edit</Link></td>
            </tr>)}</tbody>
          </table></div>}
        {(query.data.totalPages > 1 || page > 0) && <nav aria-label="Catalog pages" className="flex items-center justify-between gap-3"><Button variant="outline" disabled={page === 0} onClick={() => navigate({ page: String(page) })}>Previous</Button><span className="text-sm">Page {page + 1}</span><Button variant="outline" disabled={page + 1 >= query.data.totalPages} onClick={() => navigate({ page: String(page + 2) })}>Next</Button></nav>}
      </>}
  </div>;
}

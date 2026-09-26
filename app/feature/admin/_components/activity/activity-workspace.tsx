"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminErrorState, AdminLoadingRows } from "../admin-query-state";
import { formatAdminDateTime } from "../admin-format";
import { activityKeys, activityLabel, listActivity, type ActivityEvent } from "./activity-api";

const RESOURCE_TYPES = ["USER", "VEHICLE_MODEL", "USER_VEHICLE", "USER_SAVED_PLACE"] as const;

export function ActivityWorkspace() {
  const search = useSearchParams();
  const router = useRouter();
  const pageValue = Number(search.get("page") ?? "1");
  const page = Number.isSafeInteger(pageValue) && pageValue > 0 ? pageValue - 1 : 0;
  const filters = {
    action: (search.get("action") ?? "").slice(0, 100),
    resourceType: RESOURCE_TYPES.find((value) => value === search.get("resourceType")) ?? "",
    actorId: search.get("actorId") ?? "", from: search.get("from") ?? "", to: search.get("to") ?? "", page, size: 20,
  };
  const query = useQuery({ queryKey: [...activityKeys.root, filters], queryFn: () => listActivity(filters), retry: false });
  function navigate(changes: Record<string, string>) {
    const next = new URLSearchParams(search);
    for (const [key, value] of Object.entries(changes)) { if (value) next.set(key, value); else next.delete(key); }
    router.replace(`/admin/activity?${next}`, { scroll: false });
  }
  return <div className="flex flex-col gap-6">
    <form className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5" onSubmit={(event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      navigate({ action: String(data.get("action") ?? "").trim(), resourceType: data.get("resourceType") === "ALL" ? "" : String(data.get("resourceType") ?? ""), actorId: String(data.get("actorId") ?? "").trim(), from: String(data.get("from") ?? ""), to: String(data.get("to") ?? ""), page: "" });
    }}>
      <label className="flex flex-col gap-1.5 text-sm font-medium">Action<Input name="action" key={filters.action} defaultValue={filters.action} maxLength={100} placeholder="e.g. VEHICLE_MODEL_PUBLISHED" /></label>
      <div className="flex flex-col gap-1.5 text-sm font-medium"><label htmlFor="activity-resource">Resource</label><Select name="resourceType" key={filters.resourceType} defaultValue={filters.resourceType || "ALL"}><SelectTrigger id="activity-resource" className="h-9 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All resources</SelectItem>{RESOURCE_TYPES.map((value) => <SelectItem key={value} value={value}>{value.replaceAll("_", " ").toLowerCase()}</SelectItem>)}</SelectContent></Select></div>
      <label className="flex flex-col gap-1.5 text-sm font-medium">Actor ID<Input name="actorId" key={filters.actorId} defaultValue={filters.actorId} placeholder="User UUID" pattern="[0-9a-fA-F-]{36}" /></label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">From (UTC)<Input type="date" name="from" key={filters.from} defaultValue={filters.from} /></label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">Through (UTC)<Input type="date" name="to" key={filters.to} defaultValue={filters.to} /></label>
      <div className="flex gap-2 sm:col-span-2 lg:col-span-5"><Button type="submit">Apply filters</Button><Button type="button" variant="ghost" onClick={() => router.replace("/admin/activity")}>Clear</Button></div>
    </form>
    {query.isPending ? <AdminLoadingRows rows={5} label="Loading activity" />
      : query.isError ? <AdminErrorState error={query.error} onRetry={() => query.refetch()} />
      : <>
        <p role="status" className="text-sm text-muted-foreground">{query.data.totalElements} matching events</p>
        {query.data.content.length === 0 ? <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">No activity matches these filters.</p>
          : <ol className="divide-y rounded-xl border bg-card">{query.data.content.map((entry) => <ActivityRow key={entry.id} entry={entry} />)}</ol>}
        {query.data.totalPages > 1 && <nav aria-label="Activity pages" className="flex items-center justify-between gap-3"><Button variant="outline" disabled={page === 0} onClick={() => navigate({ page: String(page) })}>Previous</Button><span className="text-sm">Page {page + 1} of {query.data.totalPages}</span><Button variant="outline" disabled={page + 1 >= query.data.totalPages} onClick={() => navigate({ page: String(page + 2) })}>Next</Button></nav>}
      </>}
  </div>;
}

export function ActivityRow({ entry }: { entry: ActivityEvent }) {
  const keys = [...new Set([...Object.keys(entry.before), ...Object.keys(entry.after)])]
    .filter((key) => JSON.stringify(entry.before[key]) !== JSON.stringify(entry.after[key])).sort();
  return <li className="flex flex-col gap-1 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
    <div className="min-w-0"><p className="font-medium">{activityLabel(entry.action)}</p><p className="text-sm text-muted-foreground">{entry.actorDisplayName ?? (entry.actorUserId ? `User ${entry.actorUserId}` : "System")} · {entry.resourceType?.replaceAll("_", " ").toLowerCase() ?? "Resource"}</p>
      {keys.length > 0 && <details className="mt-2 text-xs text-muted-foreground"><summary className="cursor-pointer font-medium text-foreground">{keys.length} changed field{keys.length === 1 ? "" : "s"}</summary><dl className="mt-2 grid gap-1">{keys.map((key) => <div key={key} className="flex flex-wrap gap-2"><dt className="font-medium">{key}</dt><dd>{formatValue(entry.before[key])} → {formatValue(entry.after[key])}</dd></div>)}</dl></details>}
    </div><time dateTime={entry.createdAt} className="shrink-0 text-xs text-muted-foreground">{formatAdminDateTime(entry.createdAt)}</time>
  </li>;
}
function formatValue(value: unknown) { return value === undefined || value === null ? "—" : Array.isArray(value) ? value.join(", ") : String(value); }

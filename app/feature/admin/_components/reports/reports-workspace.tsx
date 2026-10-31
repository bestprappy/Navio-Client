"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FileText, LoaderCircle, MessageSquare, UserRound } from "lucide-react";

import { formatRelativeTime } from "@/app/feature/community/_components/data";
import { AuthorChip } from "@/components/social/profile-link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { pageSchema, reportSchema, type Report } from "@/lib/validations/social";

type Status = Report["status"];
const STATUSES: { id: Status; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "actioned", label: "Actioned" },
  { id: "dismissed", label: "Dismissed" },
];
const REASON_LABELS: Record<Report["reason"], string> = {
  spam: "Spam or scam", harassment: "Harassment", hate: "Hate speech", inappropriate: "Inappropriate",
  impersonation: "Impersonation", misinformation: "Misleading information", other: "Other",
};
const TARGET_ICONS = { user: UserRound, post: FileText, comment: MessageSquare } as const;

function listReports(status: Status, page: number, signal?: AbortSignal) {
  return apiRequest(`/api/admin/reports?status=${status}&page=${page}&size=20`, {
    schema: pageSchema(reportSchema), operation: "listReports", signal,
  });
}

function resolveReport(id: string, body: { status: "actioned" | "dismissed"; note: string; removeContent: boolean }) {
  return apiRequest(`/api/admin/reports/${encodeURIComponent(id)}`, {
    method: "PATCH", body: { ...body, note: body.note.trim() || null }, schema: reportSchema.or(z.unknown()), operation: "resolveReport",
  });
}

/**
 * The platform moderation queue. Open reports oldest first; each can be
 * dismissed, or actioned with the reported post or comment removed. Accounts
 * are suspended from Users, which owns account state.
 */
export function ReportsWorkspace() {
  const [status, setStatus] = useState<Status>("open");
  const reports = useInfiniteQuery({
    queryKey: ["admin", "reports", status],
    queryFn: ({ pageParam, signal }) => listReports(status, pageParam, signal),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.last ? undefined : last.number + 1),
  });
  const rows = reports.data?.pages.flatMap((page) => page.content) ?? [];
  const total = reports.data?.pages[0]?.totalElements ?? 0;

  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" aria-label="Report status" className="flex w-fit gap-1 rounded-lg bg-muted p-1">
        {STATUSES.map((option) => (
          <button key={option.id} type="button" role="tab" aria-selected={status === option.id} onClick={() => setStatus(option.id)}
            className={cn("rounded-md px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              status === option.id ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")}>
            {option.label}
          </button>
        ))}
      </div>

      <section role="tabpanel" aria-busy={reports.isPending} className="flex flex-col gap-3">
        {reports.isPending ? (
          [0, 1, 2].map((row) => <Skeleton key={row} className="h-36 w-full" />)
        ) : reports.isError ? (
          <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border bg-card p-5 text-sm text-muted-foreground">
            {reports.error.message}
            <Button type="button" variant="outline" onClick={() => void reports.refetch()}>Try again</Button>
          </div>
        ) : rows.length === 0 ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            {status === "open" ? "No reports waiting for review." : `No ${status} reports yet.`}
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{total} {status} {total === 1 ? "report" : "reports"}</p>
            <ul role="list" className="flex flex-col gap-3">
              {rows.map((report) => <ReportCard key={report.id} report={report} />)}
            </ul>
          </>
        )}
        {reports.hasNextPage ? (
          <Button type="button" variant="outline" className="w-fit" disabled={reports.isFetchingNextPage} onClick={() => void reports.fetchNextPage()}>
            Show more
          </Button>
        ) : null}
      </section>
    </div>
  );
}

function ReportCard({ report }: { report: Report }) {
  const client = useQueryClient();
  const noteId = useId();
  const [note, setNote] = useState("");
  const [removeContent, setRemoveContent] = useState(false);
  const Icon = TARGET_ICONS[report.targetType];
  const removable = report.targetType !== "user" && report.targetAvailable;

  const resolve = useMutation({
    mutationFn: (decision: "actioned" | "dismissed") =>
      resolveReport(report.id, { status: decision, note, removeContent: decision === "actioned" && removeContent }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["admin", "reports"] }),
    onError: (error) => console.error("Report resolution failed.", { component: "ReportCard", error }),
  });

  return (
    <li className="rounded-xl border bg-card p-5 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted"><Icon aria-hidden="true" className="size-4" /></span>
          <div className="min-w-0">
            <p className="font-semibold">{REASON_LABELS[report.reason]}<span className="font-normal text-muted-foreground"> on a {report.targetType}</span></p>
            <p className="text-xs text-muted-foreground">Reported {formatRelativeTime(report.createdAt)}</p>
          </div>
        </div>
        {report.status !== "open" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
            <CheckCircle2 aria-hidden="true" className="size-3.5" />
            {report.status === "actioned" ? "Actioned" : "Dismissed"}
          </span>
        ) : null}
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div className="min-w-0">
          <dt className="text-xs font-medium text-muted-foreground">Reported account</dt>
          <dd className="mt-1">{report.targetUserId ? <AuthorChip accountId={report.targetUserId} /> : "Unknown"}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-medium text-muted-foreground">Reported by</dt>
          <dd className="mt-1"><AuthorChip accountId={report.reporterId} /></dd>
        </div>
        {report.targetType !== "user" ? (
          <div className="min-w-0 sm:col-span-2">
            <dt className="text-xs font-medium text-muted-foreground">Content</dt>
            <dd className="mt-1 rounded-md bg-well px-3 py-2 break-words">
              {report.targetAvailable ? report.targetPreview ?? "(no text)" : <span className="text-muted-foreground">Already removed</span>}
            </dd>
          </div>
        ) : null}
        {report.details ? (
          <div className="min-w-0 sm:col-span-2">
            <dt className="text-xs font-medium text-muted-foreground">Reporter&apos;s note</dt>
            <dd className="mt-1 whitespace-pre-line break-words">{report.details}</dd>
          </div>
        ) : null}
        {report.resolutionNote ? (
          <div className="min-w-0 sm:col-span-2">
            <dt className="text-xs font-medium text-muted-foreground">Moderator note</dt>
            <dd className="mt-1 whitespace-pre-line break-words">{report.resolutionNote}</dd>
          </div>
        ) : null}
      </dl>

      {report.status === "open" ? (
        <div className="mt-5 flex flex-col gap-3 border-t pt-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={noteId}>Note <span className="font-normal text-muted-foreground">(optional, visible to moderators)</span></Label>
            <Textarea id={noteId} rows={2} maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} />
          </div>
          {removable ? (
            <Label className="flex items-center gap-2 font-normal">
              <Checkbox checked={removeContent} onCheckedChange={(checked) => setRemoveContent(checked === true)} />
              Remove this {report.targetType} when actioning
            </Label>
          ) : null}
          {report.targetType === "user" && report.targetUserId ? (
            <p className="text-xs text-muted-foreground">
              To suspend this account, find it in <Link href="/admin/users" className="font-medium text-primary underline underline-offset-4">Users</Link>.
            </p>
          ) : null}
          {resolve.isError ? <p role="alert" className="text-sm text-destructive">{resolve.error.message}</p> : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" disabled={resolve.isPending} onClick={() => resolve.mutate("dismissed")}>Dismiss</Button>
            <Button type="button" variant={removeContent ? "destructive" : "default"} disabled={resolve.isPending} onClick={() => resolve.mutate("actioned")}>
              {resolve.isPending ? <LoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : null}
              {removeContent ? `Remove ${report.targetType} and action` : "Mark actioned"}
            </Button>
          </div>
        </div>
      ) : null}
    </li>
  );
}

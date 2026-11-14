"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, ExternalLink, LoaderCircle, Map as MapIcon } from "lucide-react";

import { formatRelativeTime } from "@/app/feature/community/_components/data";
import { AuthorChip } from "@/components/social/profile-link";
import { Button } from "@/components/ui/button";

import {
  reportKeys,
  resolveCommentReport,
  type CommentReport,
  type CommentReportDecision,
  type CommentReportReason,
} from "./reports-api";

const REASON_LABELS: Record<CommentReportReason, string> = {
  SPAM: "Spam", HARASSMENT: "Harassment", INAPPROPRIATE: "Inappropriate content", OTHER: "Other concern",
};

const SOURCE_COPY = {
  plan: { icon: MapIcon, noun: "Shared Plan", fallbackTitle: "A plan that is no longer shared" },
  guide: { icon: BookOpen, noun: "Guide", fallbackTitle: "A Guide that was deleted" },
} as const;

type CommentReportCardProps = {
  source: "plan" | "guide";
  report: CommentReport;
};

/**
 * A comment travellers reported on a Shared Plan or Guide. Removing it hides
 * the text for everyone, as a publisher's removal does; dismissing clears the
 * reports and leaves the comment up.
 */
export function CommentReportCard({ source, report }: CommentReportCardProps) {
  const client = useQueryClient();
  const copy = SOURCE_COPY[source];
  const Icon = copy.icon;
  const reasons = report.reasons.length ? report.reasons.map((reason) => REASON_LABELS[reason]).join(", ") : "Reported";

  const [confirmingRemoval, setConfirmingRemoval] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (confirmingRemoval) confirmRef.current?.focus();
  }, [confirmingRemoval]);

  const resolve = useMutation({
    mutationFn: (decision: CommentReportDecision) => resolveCommentReport(source, report.commentId, decision),
    onSuccess: () => client.invalidateQueries({ queryKey: reportKeys.all }),
    onError: (error) => console.error("Comment report resolution failed.", {
      component: "CommentReportCard", source, commentId: report.commentId, error,
    }),
  });

  return (
    <li className="rounded-xl border bg-card p-5 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted"><Icon aria-hidden="true" className="size-4" /></span>
          <div className="min-w-0">
            <p className="font-semibold">{reasons}<span className="font-normal text-muted-foreground"> on a {copy.noun} comment</span></p>
            <p className="text-xs text-muted-foreground">
              {report.reportCount} {report.reportCount === 1 ? "report" : "reports"} · first {formatRelativeTime(report.firstReportedAt)}
              {report.reportCount > 1 ? `, latest ${formatRelativeTime(report.lastReportedAt)}` : ""}
            </p>
          </div>
        </div>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div className="min-w-0">
          <dt className="text-xs font-medium text-muted-foreground">Comment author</dt>
          <dd className="mt-1">
            {report.authorAccountId ? <AuthorChip accountId={report.authorAccountId} /> : report.authorName || "Unknown"}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-medium text-muted-foreground">Posted on</dt>
          <dd className="mt-1 min-w-0">
            {report.subjectHref ? (
              <Link href={report.subjectHref} target="_blank" rel="noopener"
                className="inline-flex max-w-full items-center gap-1 font-medium text-primary underline-offset-4 hover:underline">
                <span className="truncate">{report.subjectTitle || copy.noun}</span>
                <ExternalLink aria-hidden="true" className="size-3.5 shrink-0" />
                <span className="sr-only">(opens in a new tab)</span>
              </Link>
            ) : (
              <span className="text-muted-foreground">{report.subjectTitle || copy.fallbackTitle}</span>
            )}
          </dd>
        </div>
        <div className="min-w-0 sm:col-span-2">
          <dt className="text-xs font-medium text-muted-foreground">Comment</dt>
          <dd className="mt-1 rounded-md bg-well px-3 py-2 whitespace-pre-line break-words">{report.content || "(no text)"}</dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-col gap-3 border-t pt-4">
        {resolve.isError ? <p role="alert" className="text-sm text-destructive">{resolve.error.message}</p> : null}
        {confirmingRemoval ? (
          <div role="group" aria-label="Confirm removal" className="flex flex-wrap items-center justify-end gap-2"
            onKeyDown={(event) => { if (event.key === "Escape" && !resolve.isPending) setConfirmingRemoval(false); }}>
            <p className="mr-auto text-sm text-muted-foreground">The comment text will be removed for everyone. This cannot be undone.</p>
            <Button type="button" variant="outline" disabled={resolve.isPending} onClick={() => setConfirmingRemoval(false)}>Cancel</Button>
            <Button ref={confirmRef} type="button" variant="destructive" disabled={resolve.isPending} onClick={() => resolve.mutate("remove")}>
              {resolve.isPending ? <LoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : null}
              Confirm removal
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" disabled={resolve.isPending} onClick={() => resolve.mutate("dismiss")}>
              {resolve.isPending ? <LoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : null}
              Dismiss reports
            </Button>
            <Button type="button" variant="destructive" disabled={resolve.isPending} onClick={() => setConfirmingRemoval(true)}>
              Remove comment
            </Button>
          </div>
        )}
      </div>
    </li>
  );
}

import { z } from "zod";

import { apiRequest } from "@/lib/api-client";
import { pageSchema, reportSchema, type Report } from "@/lib/validations/social";

import {
  guideCommentReportSchema,
  planCommentReportSchema,
  toGuideCommentReport,
  toPlanCommentReport,
  type CommentReportDecision,
} from "./comment-report-model";

export type { CommentReport, CommentReportDecision, CommentReportReason } from "./comment-report-model";

/**
 * The moderation queue polls this often while the page is visible, so a report
 * filed anywhere shows up without a reload. TanStack Query pauses polling in a
 * hidden tab and refetches as soon as the moderator comes back.
 */
export const LIVE_REFRESH_MS = 15_000;

export const liveQueryOptions = {
  refetchInterval: LIVE_REFRESH_MS,
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: true,
  staleTime: 0,
} as const;

/** Where a report was filed. Each lives in the service that owns the reported content. */
export type ReportSource = "community" | "plan" | "guide";
type CommentSource = Exclude<ReportSource, "community">;

export type CommunityStatus = Report["status"];

export const reportKeys = {
  all: ["admin", "reports"] as const,
  community: (status: CommunityStatus) => ["admin", "reports", "community", status] as const,
  comments: (source: CommentSource) => ["admin", "reports", source] as const,
  count: (source: ReportSource) => ["admin", "reports", "count", source] as const,
};

// --- Profiles, posts and community comments (Community service) ---------------

export function listCommunityReports(status: CommunityStatus, page: number, size = 20, signal?: AbortSignal) {
  return apiRequest(`/api/admin/reports?status=${status}&page=${page}&size=${size}`, {
    schema: pageSchema(reportSchema), operation: "listReports", signal,
  });
}

export function resolveCommunityReport(id: string, body: { status: "actioned" | "dismissed"; note: string; removeContent: boolean }) {
  return apiRequest(`/api/admin/reports/${encodeURIComponent(id)}`, {
    method: "PATCH", body: { ...body, note: body.note.trim() || null }, schema: reportSchema.or(z.unknown()), operation: "resolveReport",
  });
}

// --- Comments on Shared Plans (Trip service) and Guides (user management) -----

const ENDPOINTS: Record<CommentSource, string> = {
  plan: "/api/admin/plan-comment-reports",
  guide: "/api/admin/guide-comment-reports",
};

export async function listCommentReports(source: CommentSource, page: number, size = 20, signal?: AbortSignal) {
  const path = `${ENDPOINTS[source]}?page=${page}&size=${size}`;
  if (source === "plan") {
    const result = await apiRequest(path, { schema: pageSchema(planCommentReportSchema), operation: "listPlanCommentReports", signal });
    return { ...result, content: result.content.map(toPlanCommentReport) };
  }
  const result = await apiRequest(path, { schema: pageSchema(guideCommentReportSchema), operation: "listGuideCommentReports", signal });
  return { ...result, content: result.content.map(toGuideCommentReport) };
}

export function resolveCommentReport(source: CommentSource, commentId: string, decision: CommentReportDecision) {
  return apiRequest(`${ENDPOINTS[source]}/${encodeURIComponent(commentId)}`, {
    method: "PATCH", body: { decision }, operation: source === "plan" ? "resolvePlanCommentReport" : "resolveGuideCommentReport",
  });
}

/** Open items waiting in one queue, for the tab badges. */
export async function countOpenReports(source: ReportSource, signal?: AbortSignal): Promise<number> {
  const page = source === "community" ? await listCommunityReports("open", 0, 1, signal) : await listCommentReports(source, 0, 1, signal);
  return page.totalElements;
}

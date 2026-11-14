import { z } from "zod";

/**
 * Reported comments on Shared Plans (Trip service) and Guides (user management),
 * as the moderation queue reads them. Both services fold every report on one
 * comment into a single row; this maps them onto one card shape.
 */

const nullableString = z.string().nullish().transform((value) => value ?? null);

export const commentReportReasonSchema = z.enum(["SPAM", "HARASSMENT", "INAPPROPRIATE", "OTHER"]);
export type CommentReportReason = z.infer<typeof commentReportReasonSchema>;

const baseCommentReport = {
  commentId: z.string(),
  content: nullableString,
  authorAccountId: nullableString,
  authorName: nullableString,
  reportCount: z.number().int().nonnegative(),
  /** Unknown reasons from a newer service are dropped rather than failing the whole row. */
  reasons: z.array(z.string()).catch([]).transform((reasons) =>
    reasons.flatMap((reason) => {
      const parsed = commentReportReasonSchema.safeParse(reason);
      return parsed.success ? [parsed.data] : [];
    })),
  firstReportedAt: z.string(),
  lastReportedAt: z.string(),
};

export const planCommentReportSchema = z.object({
  ...baseCommentReport,
  planToken: nullableString,
  planTitle: nullableString,
});
export type PlanCommentReportRow = z.infer<typeof planCommentReportSchema>;

export const guideCommentReportSchema = z.object({
  ...baseCommentReport,
  guideSource: z.enum(["CURATED", "TRAVELER"]),
  guideId: z.string(),
  guideTitle: nullableString,
});
export type GuideCommentReportRow = z.infer<typeof guideCommentReportSchema>;

/** One reported comment, whichever reader it was posted on. */
export type CommentReport = {
  commentId: string;
  content: string | null;
  authorAccountId: string | null;
  authorName: string | null;
  reportCount: number;
  reasons: CommentReportReason[];
  firstReportedAt: string;
  lastReportedAt: string;
  /** What the comment was posted on, for the card. */
  subjectTitle: string | null;
  /** Where moderators can read the comment in context; null once the plan or Guide is gone. */
  subjectHref: string | null;
};

export type CommentReportDecision = "remove" | "dismiss";

export function toPlanCommentReport(row: PlanCommentReportRow): CommentReport {
  const { planToken, planTitle, ...rest } = row;
  return { ...rest, subjectTitle: planTitle, subjectHref: planToken ? `/explore/shared/${encodeURIComponent(planToken)}` : null };
}

export function toGuideCommentReport(row: GuideCommentReportRow): CommentReport {
  const { guideSource, guideId, guideTitle, ...rest } = row;
  const href = guideTitle === null ? null
    : `/explore/guides/${encodeURIComponent(guideId)}${guideSource === "CURATED" ? "?source=curated" : ""}`;
  return { ...rest, subjectTitle: guideTitle, subjectHref: href };
}

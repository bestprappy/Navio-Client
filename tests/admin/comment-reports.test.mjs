// Run: node --experimental-transform-types --test tests/admin/comment-reports.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  guideCommentReportSchema,
  planCommentReportSchema,
  toGuideCommentReport,
  toPlanCommentReport,
} from "../../app/feature/admin/_components/reports/comment-report-model.ts";

const base = {
  commentId: "00000000-0000-4000-8000-000000000002",
  content: "Buy cheap followers",
  authorAccountId: "author-subject",
  authorName: "Someone",
  reportCount: 2,
  reasons: ["HARASSMENT", "SPAM"],
  firstReportedAt: "2026-11-14T01:00:00Z",
  lastReportedAt: "2026-11-14T02:00:00Z",
};

test("a reported plan comment links to the shared plan reader", () => {
  const report = toPlanCommentReport(planCommentReportSchema.parse({ ...base, planToken: "abc/123", planTitle: "Kyoto in spring" }));
  assert.equal(report.subjectTitle, "Kyoto in spring");
  assert.equal(report.subjectHref, "/explore/shared/abc%2F123");
  assert.deepEqual(report.reasons, ["HARASSMENT", "SPAM"]);
});

test("a plan that is no longer shared keeps its report but loses the link", () => {
  const report = toPlanCommentReport(planCommentReportSchema.parse({ ...base, planToken: null, planTitle: "Kyoto in spring" }));
  assert.equal(report.subjectHref, null);
  assert.equal(report.subjectTitle, "Kyoto in spring");
});

test("curated and traveler guide comments link to the matching guide reader", () => {
  const curated = toGuideCommentReport(guideCommentReportSchema.parse({ ...base, guideSource: "CURATED", guideId: "g1", guideTitle: "Kyoto" }));
  const traveler = toGuideCommentReport(guideCommentReportSchema.parse({ ...base, guideSource: "TRAVELER", guideId: "g2", guideTitle: "Ubud" }));
  assert.equal(curated.subjectHref, "/explore/guides/g1?source=curated");
  assert.equal(traveler.subjectHref, "/explore/guides/g2");
});

test("a deleted guide keeps its report without a broken link", () => {
  const report = toGuideCommentReport(guideCommentReportSchema.parse({ ...base, guideSource: "TRAVELER", guideId: "g3", guideTitle: null }));
  assert.equal(report.subjectHref, null);
});

test("unknown report reasons are dropped instead of hiding the whole report", () => {
  const parsed = planCommentReportSchema.safeParse({ ...base, reasons: ["SPAM", "SOMETHING_NEW"], planToken: "t", planTitle: null });
  assert.equal(parsed.success, true);
  assert.deepEqual(parsed.data.reasons, ["SPAM"]);
});

test("missing optional fields read as null rather than failing", () => {
  const parsed = guideCommentReportSchema.parse({
    commentId: "c", reportCount: 1, reasons: ["OTHER"], firstReportedAt: "2026-11-14T01:00:00Z",
    lastReportedAt: "2026-11-14T01:00:00Z", guideSource: "CURATED", guideId: "g",
  });
  assert.equal(parsed.content, null);
  assert.equal(parsed.authorAccountId, null);
  assert.equal(parsed.guideTitle, null);
});

// [DEFERRED][EXCLUDE_FROM_REPORT] PLACES_EDITORIAL - disabled by user on 2026-10-22.
// Future work only. See Navio/docs/deferred/places-editorial.md before restoring.
// BEGIN DEFERRED IMPLEMENTATION
// export type ArticleSource = {
//   id: string;
//   label: string;
//   url: string;
//   publisher: string;
//   authority: boolean;
//   checkedOn: string;
// };
// export type ArticlePassage = { text: string; sourceIds: readonly string[] };
// export type PlaceArticleDocument = {
//   placeId: string;
//   version: number;
//   locale: "en";
//   status: "draft" | "published" | "needs-review" | "withdrawn";
//   reviewedOn: string;
//   reviewDueOn: string;
//   title: string;
//   introduction: ArticlePassage;
//   sections: readonly (ArticlePassage & {
//     heading: string;
//     kind: "context" | "experience" | "visiting";
//   })[];
//   sources: readonly ArticleSource[];
// };
//
// export function articleWordCount(article: PlaceArticleDocument): number {
//   return [article.title, article.introduction.text,
//     ...article.sections.flatMap(section => [section.heading, section.text])]
//     .join(" ").trim().split(/\s+/u).filter(Boolean).length;
// }
// function validDate(value: string): boolean {
//   if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
//   const parsed = new Date(`${value}T00:00:00Z`);
//   return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
// }
// function secureSource(url: string): boolean {
//   try {
//     const parsed = new URL(url);
//     return parsed.protocol === "https:" && !parsed.username && !parsed.password;
//   } catch { return false; }
// }
//
// /** Editorial completeness checks, not a probability of accuracy. Facts still need source review.
//  * Source dates use the editorial team's Bangkok calendar consistently on server and client.
//  * No review count, rating, fame threshold, provider text or runtime generation is involved.
//  */
// export function articleIssues(article: PlaceArticleDocument, placeId: string, now = new Date()): string[] {
//   const issues: string[] = [];
//   const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(now);
//   if (article.placeId !== placeId) issues.push("identity");
//   if (article.status !== "published") issues.push("not-published");
//   if (!validDate(article.reviewedOn) || article.reviewedOn > today) issues.push("review-date");
//   if (!validDate(article.reviewDueOn) || article.reviewDueOn <= today || article.reviewDueOn <= article.reviewedOn) issues.push("review-due");
//   const publishers = new Set(article.sources.map(source => source.publisher.trim().toLowerCase()));
//   if (publishers.size < 2 || publishers.has("") || !article.sources.some(source => source.authority)) issues.push("source-coverage");
//   const sourceIds = new Set(article.sources.map(source => source.id));
//   if (sourceIds.size !== article.sources.length || article.sources.some(source => !source.id || !source.label.trim() || !secureSource(source.url) || !validDate(source.checkedOn) || source.checkedOn > article.reviewedOn)) issues.push("sources");
//   const passages = [article.introduction, ...article.sections];
//   if (passages.some(passage => !passage.text.trim() || !passage.sourceIds.length || passage.sourceIds.some(id => !sourceIds.has(id)))) issues.push("citations");
//   if (article.sections.filter(section => section.kind === "experience").length < 2) issues.push("experiences");
//   if (!article.sections.some(section => section.kind === "context")) issues.push("context");
//   const count = articleWordCount(article);
//   if (count < 250 || count > 500) issues.push("word-budget");
//   if (!article.title.trim() || article.version < 1 || !Number.isInteger(article.version)) issues.push("document");
//   return issues;
// }
//
// /** Bangkok is UTC+07:00 year-round; wake just after its next editorial calendar day. */
// export function millisecondsUntilEditorialRollover(now: Date): number {
//   const day = 24 * 60 * 60 * 1000;
//   return day - ((now.getTime() + 7 * 60 * 60 * 1000) % day);
// }
// END DEFERRED IMPLEMENTATION

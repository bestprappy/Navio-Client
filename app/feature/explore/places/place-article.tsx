// [DEFERRED][EXCLUDE_FROM_REPORT] PLACES_EDITORIAL - disabled by user on 2026-10-22.
// Future work only. See Navio/docs/deferred/places-editorial.md before restoring.
// BEGIN DEFERRED IMPLEMENTATION
// "use client";
// /* Provider photos stay live, with their author/source credits; never optimized or stored. */
// /* eslint-disable @next/next/no-img-element */
// import { useEffect, useState } from "react";
// import { BookOpen, ChevronDown, ExternalLink } from "lucide-react";
// import { safeExternalUrl, type DiscoveryItem } from "./places-api";
// import { PhotoCredit } from "./places-discovery";
// import { articleIssues, articleWordCount, millisecondsUntilEditorialRollover } from "./place-article-model";
// import { placeArticles } from "./place-articles.data";
//
// type Photo = DiscoveryItem["photos"][number];
// function ArticlePhoto({ item, photo, wide = false }: {
//   item: DiscoveryItem;
//   photo: Photo;
//   wide?: boolean;
// }) {
//   const [failed, setFailed] = useState(false);
//   if (failed) return null;
//   return (
//     <figure className="min-w-0 space-y-2">
//       <div className={`overflow-hidden rounded-xl bg-muted ${wide ? "aspect-[16/9]" : "aspect-[4/3]"}`}>
//         <img
//           src={safeExternalUrl(photo.url)}
//           alt={`${item.place.name}, place photograph`}
//           loading="lazy"
//           referrerPolicy="no-referrer"
//           className="size-full object-cover"
//           onError={() => setFailed(true)}
//         />
//       </div>
//       <figcaption className="space-y-1">
//         <span className="block text-[11px] text-muted-foreground">Photo from Google Maps</span>
//         <PhotoCredit item={{ ...item, photoAttributions: photo.attributions, photoGoogleMapsUri: photo.googleMapsUri }} />
//       </figcaption>
//     </figure>
//   );
// }
//
// /** Only source-checked original editorial content. A provider summary is never rewritten. */
// export function PlaceArticle({ item }: { item: DiscoveryItem }) {
//   const id = item.place.providerPlaceId;
//   const article = Object.hasOwn(placeArticles, id) ? placeArticles[id] : undefined;
//   const [checkedAt, setCheckedAt] = useState(() => new Date());
//   const hasArticle = !!article;
//   useEffect(() => {
//     if (!hasArticle) return;
//     let timer: ReturnType<typeof setTimeout>;
//     const recheck = () => {
//       clearTimeout(timer);
//       const now = new Date();
//       setCheckedAt(now);
//       timer = setTimeout(recheck, millisecondsUntilEditorialRollover(now) + 50);
//     };
//     const onVisible = () => { if (document.visibilityState === "visible") recheck(); };
//     timer = setTimeout(recheck, millisecondsUntilEditorialRollover(new Date()) + 50);
//     document.addEventListener("visibilitychange", onVisible);
//     window.addEventListener("focus", recheck);
//     return () => {
//       clearTimeout(timer);
//       document.removeEventListener("visibilitychange", onVisible);
//       window.removeEventListener("focus", recheck);
//     };
//   }, [hasArticle]);
//   if (!article || articleIssues(article, id, checkedAt).length ||
//       item.businessStatus === "CLOSED_PERMANENTLY" || item.businessStatus === "CLOSED_TEMPORARILY") return null;
//
//   const suppliedPhotos = item.photos.length ? item.photos : item.place.photoUrl ? [{
//     url: item.place.photoUrl,
//     attributions: item.photoAttributions,
//     googleMapsUri: item.photoGoogleMapsUri,
//   }] : [];
//   const photos = [...new Map(suppliedPhotos
//     .filter(photo => safeExternalUrl(photo.url))
//     .map(photo => [photo.url, photo])).values()].slice(0, 2);
//   const readingMinutes = Math.max(1, Math.ceil(articleWordCount(article) / 200));
//   const reviewed = new Intl.DateTimeFormat("en-GB", {
//     day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
//   }).format(new Date(`${article.reviewedOn}T00:00:00Z`));
//   const paragraphClass = "text-sm leading-7 text-muted-foreground";
//   return (
//     <section aria-label="About this place" className="@container/article space-y-5 border-t border-border pt-7">
//       <header className="space-y-3">
//         <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
//           <span className="inline-flex items-center gap-1.5 font-medium text-primary">
//             <BookOpen className="size-3.5" aria-hidden="true" />Navio editorial
//           </span>
//           <span>{readingMinutes} min read</span>
//         </div>
//         <h2 className="text-xl font-semibold tracking-tight">About this place</h2>
//         <h3 className="text-lg font-medium leading-snug">{article.title}</h3>
//       </header>
//       <div className={photos[0] ? "grid items-start gap-5 @sm/article:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]" : ""}>
//         {photos[0] && <ArticlePhoto key={photos[0].url} item={item} photo={photos[0]} />}
//         <p className={paragraphClass}>{article.introduction.text}</p>
//       </div>
//       <details className="group/story">
//         <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg px-1 text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
//           <span className="group-open/story:hidden">Read the story</span>
//           <span className="hidden group-open/story:inline">Show less</span>
//           <ChevronDown className="size-4 transition-transform group-open/story:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
//         </summary>
//         <div className="space-y-6 pt-3">
//           {article.sections.map((section, index) => (
//             <div key={`${section.kind}:${section.heading}`} className="space-y-5">
//               {index === 2 && photos[1] && <ArticlePhoto key={photos[1].url} item={item} photo={photos[1]} wide />}
//               <div className="space-y-2">
//                 <h3 className="text-base font-medium">{section.heading}</h3>
//                 <p className={paragraphClass}>{section.text}</p>
//               </div>
//             </div>
//           ))}
//           <footer className="space-y-3 border-t border-border pt-4">
//             <p className="text-xs leading-5 text-muted-foreground">
//               Original Navio article. Sources checked <time dateTime={article.reviewedOn}>{reviewed}</time>.
//             </p>
//             <ul aria-label="Article sources" className="space-y-2">
//               {article.sources.map(source => (
//                 <li key={source.id}>
//                   <a href={safeExternalUrl(source.url)} target="_blank" rel="noreferrer"
//                     className="inline-flex min-h-8 items-center gap-2 text-xs font-medium text-primary underline-offset-4 hover:underline">
//                     {source.label}<ExternalLink className="size-3 shrink-0" aria-hidden="true" />
//                   </a>
//                 </li>
//               ))}
//             </ul>
//           </footer>
//         </div>
//       </details>
//     </section>
//   );
// }
// END DEFERRED IMPLEMENTATION

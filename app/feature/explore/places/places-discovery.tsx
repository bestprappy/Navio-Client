"use client";
/* Google photos retain provider attribution and bypass Next's image optimizer. */
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Compass, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AddPlaceToPlan,
  DiscoveryPlanBanner,
  useDiscoveryPlan,
} from "./plan-context";
import { safeExternalUrl, type DiscoveryItem } from "./places-api";
import { GoogleAttribution } from "./google-attribution";
import { explorePlaces, PlaceExploreError } from "./explore-api";
import {
  countries,
  interests,
  parsePlaceSearch,
  partitionPlaces,
  resultMode,
  timeLabel,
  updatePlaceSearch,
  type PlaceSearchState,
} from "./search-state";
import { PlaceSearchControls, usePlaceColumns } from "./search-controls";

export function PhotoCredit({ item }: { item: DiscoveryItem }) {
  return (
    <div className="flex min-w-0 flex-wrap gap-x-2 gap-y-1 text-[11px] leading-4 text-muted-foreground">
      {item.photoAttributions.map((author, index) =>
        safeExternalUrl(author.uri) ? (
          <a
            key={index}
            href={safeExternalUrl(author.uri)}
            target="_blank"
            rel="noreferrer"
            className="break-words underline-offset-2 hover:underline"
          >
            Photo: {author.displayName}
          </a>
        ) : (
          <span key={index}>Photo: {author.displayName}</span>
        ),
      )}
      {safeExternalUrl(item.photoGoogleMapsUri) && (
        <a
          href={safeExternalUrl(item.photoGoogleMapsUri)}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          Photo source
        </a>
      )}
    </div>
  );
}
function PlaceCard({
  item,
  context,
}: {
  item: DiscoveryItem;
  context: string;
}) {
  const p = item.place;
  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-[border-color,box-shadow] duration-200 hover:border-foreground/20 hover:shadow-md motion-reduce:transition-none">
      <Link
        href={`/explore/places/${encodeURIComponent(p.providerPlaceId)}?${context}`}
        onClick={(e) => {
          if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey)
            sessionStorage.setItem("navio-places-return", p.providerPlaceId);
        }}
        className="block rounded-t-2xl outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <div className="absolute inset-0 flex items-center justify-center">
            <MapPin
              className="size-8 text-muted-foreground/40"
              aria-hidden="true"
            />
          </div>
          {safeExternalUrl(p.photoUrl) && (
            <img
              src={safeExternalUrl(p.photoUrl)}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              className="relative size-full object-cover"
              onError={(e) => {
                e.currentTarget.hidden = true;
              }}
            />
          )}
        </div>
        <div className="px-4 pt-4">
          <p className="mb-2 min-h-4 truncate text-[11px] font-medium text-muted-foreground">
            {p.category || "Place to explore"}
          </p>
          <h3 className="line-clamp-2 min-h-12 text-base font-semibold leading-6 tracking-tight transition-colors group-hover:text-primary motion-reduce:transition-none">
            {p.name}
          </h3>
          <p className="mt-1 flex min-h-5 items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {p.address || "View location on map"}
            </span>
          </p>
          <div className="mt-3 flex min-h-4 items-center gap-1 text-xs">
            {p.rating != null && (
              <>
                <Star
                  className="size-3 fill-current text-accent"
                  aria-hidden="true"
                />
                <span className="font-medium">{p.rating.toFixed(1)}</span>
                <span className="truncate text-muted-foreground">
                  · {(p.reviewCount || 0).toLocaleString()} reviews
                </span>
              </>
            )}
          </div>
        </div>
      </Link>
      <div className="mt-auto space-y-3 px-4 pb-4 pt-3">
        <div className="min-h-4">
          <PhotoCredit item={item} />
        </div>
        <div className="border-t border-border/50 pt-3">
          <AddPlaceToPlan placeId={p.providerPlaceId} />
        </div>
      </div>
    </article>
  );
}
const grid =
  "grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-5";
function PlaceGrid({
  items,
  context,
}: {
  items: DiscoveryItem[];
  context: string;
}) {
  return (
    <div className={grid}>
      {items.map((item) => (
        <PlaceCard
          key={item.place.providerPlaceId}
          item={item}
          context={context}
        />
      ))}
    </div>
  );
}
function LoadingGrid() {
  return (
    <div role="status" aria-label="Loading places" className={grid}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-border/60 bg-card"
        >
          <Skeleton className="aspect-[4/3] rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-12" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="mt-4 h-9" />
          </div>
        </div>
      ))}
    </div>
  );
}
function EmptyPlaces({ retry, error }: { retry?: () => void; error?: string }) {
  return (
    <div
      role={error ? "alert" : undefined}
      className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card px-5 py-10 text-center"
    >
      <Compass className="size-6 text-muted-foreground/60" aria-hidden="true" />
      <p className="text-sm font-medium">
        {error || "No matching places in this selection"}
      </p>
      <p className="max-w-md text-xs leading-5 text-muted-foreground">
        {error
          ? "Your selections are saved. You can try again."
          : "Try another country, fewer filters, or a broader search."}
      </p>
      {retry && (
        <Button size="sm" variant="outline" onClick={retry}>
          Try again
        </Button>
      )}
    </div>
  );
}
const descriptions: Record<string, string> = {
  popular: "Well-known places to start exploring.",
  "hidden-gems": "Highly rated places with fewer reviews in this selection.",
  indoor: "Museums, galleries, and a little room to slow down.",
  scenic: "Gardens, viewpoints, and places with a different perspective.",
  food: "A taste of the neighborhood, from cafés to local tables.",
  "things-to-do": "Culture, recreation, and something new to try.",
  seasonal: "Ideas for your selected month or local season.",
};

export function DiscoveryExpand({
  count,
  hasMore,
  onExpand,
}: {
  count: number;
  hasMore: boolean;
  onExpand: () => void;
}) {
  return count > 4 || hasMore ? (
    <button
      type="button"
      className="inline-flex min-h-10 shrink-0 items-center gap-1.5 text-xs font-medium hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
      onClick={onExpand}
    >
      View selection
      <ArrowRight className="size-3.5" />
    </button>
  ) : null;
}
function SeasonalNotice({
  notice,
  sources,
}: {
  notice: string;
  sources: string[];
}) {
  return (
    <details className="rounded-xl border border-border/60 bg-muted/25 px-4 py-3 text-xs text-muted-foreground">
      <summary className="cursor-pointer font-medium text-foreground">
        {sources.length
          ? "About seasonal picks"
          : "About Navio’s seasonal inspiration"}
      </summary>
      <p className="mt-2 leading-5">{notice}</p>
      {sources.map((source) => (
        <a
          key={source}
          href={safeExternalUrl(source)}
          target="_blank"
          rel="noreferrer"
          className="mt-2 block text-primary underline underline-offset-4"
        >
          Seasonal reference
        </a>
      ))}
    </details>
  );
}
export function PlaceFeed({
  state,
  collection,
  destination,
  context,
  showSeasonalNotice = false,
}: {
  state: PlaceSearchState;
  collection: string;
  destination: string;
  context: string;
  showSeasonalNotice?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const cache = useQueryClient();
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const columns = usePlaceColumns();
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const query = useInfiniteQuery({
    queryKey: ["places-explore", state, collection, destination],
    queryFn: ({ pageParam, signal }) =>
      explorePlaces(state, collection, destination, pageParam, signal),
    initialPageParam: "",
    getNextPageParam: (page) => page.cursor || undefined,
    enabled: visible,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const first = query.data?.pages[0];
  const items = [
    ...new Map(
      (query.data?.pages.flatMap((p) => p.items) || []).map((i) => [
        i.place.providerPlaceId,
        i,
      ]),
    ).values(),
  ];
  const results = resultMode(state);
  const partition = partitionPlaces(
    items,
    first?.recommendationIds || [],
    columns,
  );
  const title =
    collection === "seasonal"
      ? "Seasonal picks"
      : interests.find((i) => i.id === collection)?.label || "Matching places";
  if (
    first &&
    !items.length &&
    !first.cursor &&
    !query.isError &&
    !results &&
    collection === "hidden-gems"
  )
    return showSeasonalNotice && first.seasonalNotice ? (
      <SeasonalNotice
        notice={first.seasonalNotice}
        sources={first.seasonalSources}
      />
    ) : null;
  if (
    first &&
    !items.length &&
    !results &&
    collection === "seasonal" &&
    !first.cursor &&
    !first.seasonalSources.length
  )
    return first.seasonalNotice ? (
      <SeasonalNotice
        notice={first.seasonalNotice}
        sources={first.seasonalSources}
      />
    ) : null;
  return (
    <section
      ref={ref}
      className="space-y-5"
      aria-label={results ? "Place search results" : title}
    >
      {first?.seasonalNotice &&
        (results || collection === "seasonal" || showSeasonalNotice) && (
          <SeasonalNotice
            notice={first.seasonalNotice}
            sources={first.seasonalSources}
          />
        )}
      {query.isPending ? (
        <>
          <SectionHeading
            title={title}
            description={
              results
                ? "Finding places that match your search."
                : descriptions[collection]
            }
          />
          <LoadingGrid />
        </>
      ) : query.isError && !first ? (
        <>
          <SectionHeading
            title={title}
            description={descriptions[collection]}
          />
          <EmptyPlaces
            error={query.error.message}
            retry={() => void query.refetch()}
          />
        </>
      ) : (
        <>
          {results && partition.recommendations.length > 0 && (
            <div className="space-y-5">
              <SectionHeading
                title="Recommendations"
                description="Strong matches with consistently high Google ratings."
              />
              <PlaceGrid items={partition.recommendations} context={context} />
            </div>
          )}
          <div
            className={
              results && partition.recommendations.length
                ? "space-y-5 border-t border-border/60 pt-8 sm:pt-10"
                : "space-y-5"
            }
          >
            <SectionHeading
              title={title}
              description={
                results
                  ? "Places that fit your search and selected filters."
                  : descriptions[collection]
              }
              action={
                !results && !expanded ? (
                  <DiscoveryExpand
                    count={items.length}
                    hasMore={!!query.hasNextPage}
                    onExpand={() => setExpanded(true)}
                  />
                ) : undefined
              }
            />
            {(results
              ? partition.matches
              : expanded
                ? items
                : items.slice(0, 4)
            ).length > 0 ? (
              <PlaceGrid
                items={
                  results
                    ? partition.matches
                    : expanded
                      ? items
                      : items.slice(0, 4)
                }
                context={context}
              />
            ) : results && partition.recommendations.length ? (
              <p className="rounded-xl bg-muted/25 px-4 py-3 text-xs text-muted-foreground">
                All matches on this page are in Recommendations above.
              </p>
            ) : (
              <EmptyPlaces />
            )}
          </div>
          {(results || expanded || !items.length) && query.hasNextPage && (
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                disabled={query.isFetchingNextPage}
                onClick={() => void query.fetchNextPage()}
              >
                {query.isFetchingNextPage
                  ? "Finding more places…"
                  : query.isFetchNextPageError
                    ? "Retry loading places"
                    : "Load more places"}
              </Button>
              {!items.length && (
                <p className="text-xs text-muted-foreground">
                  This page has no matches. More places are available to check.
                </p>
              )}
            </div>
          )}
          {query.isFetchNextPageError && (
            <div
              role="alert"
              className="flex flex-wrap items-center gap-3 text-xs text-destructive"
            >
              <p>{query.error?.message}</p>
              {query.error instanceof PlaceExploreError &&
                query.error.status === 400 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      void cache.resetQueries({
                        queryKey: [
                          "places-explore",
                          state,
                          collection,
                          destination,
                        ],
                        exact: true,
                      })
                    }
                  >
                    Start search again
                  </Button>
                )}
            </div>
          )}
          {query.isError && !query.isFetchNextPageError && first && (
            <EmptyPlaces
              error={query.error.message}
              retry={() => void query.refetch()}
            />
          )}
          {items.length > 0 && <GoogleAttribution />}
        </>
      )}
    </section>
  );
}
function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function PlacesDiscovery() {
  const params = useSearchParams();
  const router = useRouter();
  const { plan } = useDiscoveryPlan();
  const effectiveParams = new URLSearchParams(params);
  if (
    plan &&
    !params.has("country") &&
    countries.some((c) => c.code === plan.destinationCountryCode)
  )
    effectiveParams.set("country", plan.destinationCountryCode!);
  if (plan && !params.has("time") && !params.has("month"))
    effectiveParams.set("time", `month:${Number(plan.startDate.slice(5, 7))}`);
  const state = parsePlaceSearch(effectiveParams);
  const results = resultMode(state);
  const legacyDestination =
    !state.country && !state.query ? params.get("destination") || "" : "";
  const context = new URLSearchParams(effectiveParams);
  context.set("tab", "places");
  const active = interests.find((i) => i.id === params.get("collection"))?.id;
  const selected = state.interests.length
    ? state.interests
    : active
      ? [active]
      : interests.map((i) => i.id);
  const country = countries.find((c) => c.code === state.country)?.name;
  function change(changes: Partial<PlaceSearchState>) {
    router.push(`/explore?${updatePlaceSearch(effectiveParams, changes)}`, {
      scroll: false,
    });
  }
  return (
    <div className="space-y-8 sm:space-y-10">
      <DiscoveryPlanBanner />
      <PlaceSearchControls
        state={state}
        onChange={change}
        onPlace={(id) => {
          sessionStorage.setItem("navio-places-return", id);
          router.push(`/explore/places/${encodeURIComponent(id)}?${context}`);
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <span className="flex min-w-0 items-center gap-2">
          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
          <span>
            {results ? "Finding places" : "Discovering"} ·{" "}
            {country || legacyDestination || "Across destinations"}
            {state.time !== "any" ? ` · ${timeLabel(state.time)}` : ""}
          </span>
        </span>
        <span>
          {results
            ? "Relevant places, thoughtfully selected"
            : "Explore at your own pace"}
        </span>
      </div>
      <div className="space-y-10 sm:space-y-12">
        {results ? (
          <PlaceFeed
            key={`results-${params}`}
            state={state}
            collection=""
            destination=""
            context={context.toString()}
          />
        ) : (
          <>
            {state.time !== "any" && !state.interests.length && !active && (
              <PlaceFeed
                key={`seasonal-${params}`}
                state={state}
                collection="seasonal"
                destination={legacyDestination}
                context={context.toString()}
              />
            )}
            {selected.map((collection, index) => (
              <PlaceFeed
                key={`${collection}-${params}`}
                state={state}
                collection={collection}
                destination={legacyDestination}
                context={context.toString()}
                showSeasonalNotice={
                  index === 0 && (state.interests.length > 0 || !!active)
                }
              />
            ))}
          </>
        )}
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-5 text-[11px] leading-5 text-muted-foreground">
        <span>
          Place information from Google Maps. Selections are a starting point,
          not an exhaustive directory.
        </span>
        <GoogleAttribution />
      </footer>
    </div>
  );
}

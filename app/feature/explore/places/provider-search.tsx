"use client";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Globe2, LoaderCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { GoogleAttribution } from "./google-attribution";
import { ProviderPlaceCard } from "./provider-place-card";
import {
  canSearchProvider,
  ProviderSearchError,
  searchProviderPlaces,
} from "./provider-search-api";

type ProviderSearchContextValue = {
  query: string;
  country: string;
  countryName?: string;
  requested: boolean;
  request: () => void;
  results: ReturnType<typeof useProviderResults>;
};
const ProviderSearchContext = createContext<ProviderSearchContextValue | null>(null);

function useProviderSearchContext(component: string) {
  const value = useContext(ProviderSearchContext);
  if (!value)
    throw new Error(`<ProviderSearch.${component}> must be rendered inside <ProviderSearch>.`);
  return value;
}

function useProviderResults(query: string, country: string, requested: boolean) {
  return useInfiniteQuery({
    queryKey: ["places-provider-search", query.trim(), country],
    queryFn: ({ pageParam, signal }) => searchProviderPlaces(query, country, pageParam, signal),
    initialPageParam: "",
    getNextPageParam: (page) => page.cursor || undefined,
    // Paid boundary: only an explicit press enables the query. No retries, no background refetch,
    // and nothing kept once the panel unmounts (a new search remounts it and aborts the old one).
    enabled: requested,
    retry: false,
    staleTime: Infinity,
    gcTime: 0,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

/**
 * Root of the catalogue boundary. Render it keyed by query and country so a changed search
 * starts unrequested again.
 */
function ProviderSearchRoot({
  query,
  country,
  countryName,
  children,
}: {
  query: string;
  country: string;
  countryName?: string;
  children: ReactNode;
}) {
  const { requireAuth } = useRequireAuth();
  const [requested, setRequested] = useState(false);
  const results = useProviderResults(query, country, requested);
  const request = useCallback(() => {
    requireAuth(() => setRequested(true));
  }, [requireAuth]);
  const value: ProviderSearchContextValue = {
    query: query.trim(),
    country,
    countryName,
    requested,
    request,
    results,
  };
  if (!canSearchProvider(query)) return null;
  return (
    <ProviderSearchContext.Provider value={value}>
      <section
        aria-labelledby="provider-search-heading"
        className="space-y-6 rounded-2xl border-2 border-dashed border-border bg-muted/30 p-4 sm:p-6"
      >
        {children}
      </section>
    </ProviderSearchContext.Provider>
  );
}

function ProviderSearchPrompt() {
  const { query, countryName, requested, request, results } = useProviderSearchContext("Prompt");
  const busy = requested && results.isPending;
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-card text-muted-foreground shadow-sm">
          <Globe2 className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 space-y-1">
          <h2 id="provider-search-heading" className="text-base font-semibold tracking-tight">
            {requested ? "Results from Google Maps" : "Navio's catalogue ends here"}
          </h2>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            {requested
              ? `Places Google Maps found for “${query}”${countryName ? ` in ${countryName}` : ""}. Not reviewed by Navio.`
              : "The catalogue covers a small, hand-picked set of Bangkok places. Google Maps can search everywhere else. Searches need an account and are limited each day."}
          </p>
        </div>
      </div>
      {!requested && (
        <Button onClick={request} className="w-full shrink-0 sm:w-auto" disabled={busy}>
          {busy ? (
            <LoaderCircle className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
          ) : (
            <Search aria-hidden="true" />
          )}
          Search Google Maps for “{query.length > 32 ? `${query.slice(0, 32)}…` : query}”
        </Button>
      )}
    </div>
  );
}

const grid = "grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

function ProviderSearchResults() {
  const { requested, results } = useProviderSearchContext("Results");
  if (!requested) return null;
  if (results.isPending)
    return (
      <div role="status" aria-label="Searching Google Maps" className={grid}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-3 rounded-xl border border-border/70 bg-card p-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-8" />
            <Skeleton className="h-9" />
          </div>
        ))}
      </div>
    );
  const places = [
    ...new Map(
      (results.data?.pages.flatMap((page) => page.items) ?? []).map((place) => [place.providerPlaceId, place]),
    ).values(),
  ];
  const last = results.data?.pages.at(-1);
  return (
    <div className="space-y-5">
      {results.isError && !results.isFetchNextPageError ? (
        <ProviderSearchFailure error={results.error} onRetry={() => void results.refetch()} />
      ) : places.length ? (
        <ul className={grid} aria-label="Google Maps results">
          {places.map((place) => (
            <li key={place.providerPlaceId} className="min-w-0">
              <ProviderPlaceCard place={place} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl bg-card px-4 py-3 text-sm text-muted-foreground">
          Google Maps found nothing for this search. Try other words or another country.
        </p>
      )}
      {results.isFetchNextPageError && (
        <ProviderSearchFailure error={results.error} onRetry={() => void results.fetchNextPage()} />
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {results.hasNextPage && !results.isFetchNextPageError ? (
          <Button
            variant="outline"
            disabled={results.isFetchingNextPage}
            onClick={() => void results.fetchNextPage()}
          >
            {results.isFetchingNextPage ? "Searching Google Maps…" : "Show more from Google Maps"}
          </Button>
        ) : last && places.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            {last.page >= last.maxPages
              ? `That's the most Navio shows for one search (${last.maxPages} pages). Try a narrower search.`
              : "No more Google Maps results."}
          </p>
        ) : (
          <span />
        )}
        {places.length > 0 && <GoogleAttribution />}
      </div>
    </div>
  );
}

function ProviderSearchFailure({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const retryable = error instanceof ProviderSearchError ? error.retryable : true;
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium">{error.message}</p>
        <p className="text-xs text-muted-foreground">Navio&apos;s catalogue above still works.</p>
      </div>
      {retryable && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export const ProviderSearch = Object.assign(ProviderSearchRoot, {
  Prompt: ProviderSearchPrompt,
  Results: ProviderSearchResults,
});

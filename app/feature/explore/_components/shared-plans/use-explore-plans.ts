"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import {
  EXPLORE_SHARED_PLANS_QUERY_KEY,
  ExplorePlansError,
  fetchExplorePlansPage,
  type ExplorePlan,
  type ExplorePlansPage,
} from "./explore-plans-api";

const NO_PLANS: ExplorePlan[] = [];

/**
 * The listed-plans feed.
 *
 * @param initialPage the first page, fetched on the server with the Explore
 *                    route so the section paints with real cards instead of a
 *                    skeleton. Null when that fetch failed; the browser then
 *                    retries on its own.
 */
export function useExplorePlans(initialPage: ExplorePlansPage | null) {
  const query = useInfiniteQuery({
    queryKey: EXPLORE_SHARED_PLANS_QUERY_KEY,
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => fetchExplorePlansPage(pageParam, signal),
    getNextPageParam: (page) => (page.last ? undefined : page.number + 1),
    initialData: initialPage ? { pages: [initialPage], pageParams: [0] } : undefined,
    // Server-rendered data is fresh for a moment; after that a revisit refetches
    // so a plan its owner just unlisted does not linger.
    staleTime: 30_000,
    retry: (count, error) =>
      count < 2 && !(error instanceof ExplorePlansError && error.status >= 400 && error.status < 500),
  });

  const plans = useMemo(() => {
    if (!query.data) return NO_PLANS;
    // Newest-first paging can shift by one between pages; keep the first copy.
    const byToken = new Map<string, ExplorePlan>();
    for (const plan of query.data.pages.flatMap((page) => page.content)) {
      if (!byToken.has(plan.token)) byToken.set(plan.token, plan);
    }
    return [...byToken.values()];
  }, [query.data]);

  return {
    plans,
    total: query.data?.pages[0]?.totalElements ?? 0,
    isLoading: query.isPending,
    isError: query.isError && plans.length === 0,
    isFetchingMore: query.isFetchingNextPage,
    hasMore: query.hasNextPage,
    loadMoreFailed: query.isFetchNextPageError,
    fetchMore: query.fetchNextPage,
    refetch: query.refetch,
  };
}

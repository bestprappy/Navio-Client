"use client";

import type { ReactNode } from "react";
import { Clock, Rocket, TrendingUp, X } from "lucide-react";

import { CommunityPostCard } from "../_components/community-post-card";
import type { CommunityFeedSort, CommunityGroup, CommunityPost } from "../_components/data";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CommunityQueryError } from "../_components/community-query-state";

const SORT_OPTIONS = [
  { value: "best", label: "Best", icon: Rocket },
  { value: "new", label: "New", icon: Clock },
  { value: "top", label: "Top", icon: TrendingUp },
] as const satisfies readonly { value: CommunityFeedSort; label: string; icon: typeof Rocket }[];

type CommunityFeedProps = {
  posts: CommunityPost[];
  groups: CommunityGroup[];
  sort: CommunityFeedSort;
  onSortChange: (sort: CommunityFeedSort) => void;
  searchQuery?: string;
  onClearSearch?: () => void;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  /** Shown when there are no posts and no search. */
  emptyState: ReactNode;
  metaVariant?: "group" | "author";
  label: string;
};

export function CommunityFeed({
  posts,
  groups,
  sort,
  onSortChange,
  searchQuery = "",
  onClearSearch,
  isLoading,
  error,
  onRetry,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
  emptyState,
  metaVariant = "group",
  label,
}: CommunityFeedProps) {
  const groupsById = new Map(groups.map((group) => [group.id, group]));
  const searching = searchQuery.trim().length > 0;

  return (
    <section className="flex min-w-0 flex-col gap-2" aria-label={label}>
      <div className="flex flex-wrap items-center gap-2 px-1">
        <div role="group" aria-label="Sort posts" className="flex items-center gap-1">
          {SORT_OPTIONS.map(({ value, label: optionLabel, icon: Icon }) => {
            const active = sort === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => onSortChange(value)}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className={cn("size-4", active && "text-primary")} aria-hidden="true" />
                {optionLabel}
              </button>
            );
          })}
        </div>
        {searching ? (
          <span className="ml-auto inline-flex max-w-full items-center gap-1 rounded-full bg-primary/10 py-1 pl-3 pr-1 text-xs font-semibold text-primary">
            <span className="truncate">Results for “{searchQuery.trim()}”</span>
            {onClearSearch ? (
              <button
                type="button"
                onClick={onClearSearch}
                aria-label="Clear search"
                className="inline-flex size-5 items-center justify-center rounded-full hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            ) : null}
          </span>
        ) : null}
      </div>

      <CommunityQueryError error={error} onRetry={onRetry} />

      {isLoading ? (
        <div role="status" className="flex flex-col divide-y divide-border">
          <span className="sr-only">Loading posts</span>
          {[0, 1, 2].map((item) => (
            <div key={item} className="flex flex-col gap-2.5 px-4 py-4">
              <Skeleton className="h-4 w-48 rounded-full" />
              <Skeleton className="h-6 w-4/5 rounded-full" />
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-8 w-56 rounded-full" />
            </div>
          ))}
        </div>
      ) : null}

      {!isLoading && !error && posts.length === 0 ? (
        searching ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center">
            <p className="font-semibold text-foreground">No posts match “{searchQuery.trim()}”</p>
            <p className="mt-1 text-sm text-muted-foreground">Try a place name, a route, or fewer words.</p>
          </div>
        ) : (
          emptyState
        )
      ) : null}

      {!isLoading && posts.length > 0 ? (
        <ol className="flex flex-col divide-y divide-border">
          {posts.map((post) => (
            <li key={post.id} className="py-1">
              <CommunityPostCard
                post={post}
                group={groupsById.get(post.groupId) ?? null}
                metaVariant={metaVariant}
              />
            </li>
          ))}
        </ol>
      ) : null}

      {hasNextPage && onLoadMore ? (
        <Button
          variant="outline"
          className="mx-auto mt-2 rounded-full"
          disabled={isFetchingNextPage}
          onClick={onLoadMore}
        >
          {isFetchingNextPage ? "Loading…" : "Show more posts"}
        </Button>
      ) : null}
    </section>
  );
}

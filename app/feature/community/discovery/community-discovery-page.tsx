"use client";

import { useMemo } from "react";
import { useAtom } from "jotai";
import { Compass } from "lucide-react";

import { communityDiscoveryCategoryAtom, communitySearchQueryAtom } from "../_components/community-atoms";
import { CommunityErrorBoundary } from "../_components/community-error-boundary";
import { useCommunityGroups } from "../_components/community-queries";
import type { CommunityDiscoveryCategory, CommunityGroup } from "../_components/data";
import { communityDiscoveryCategories } from "../_components/data";
import { CommunityDiscoveryGroupCard } from "./community-discovery-group-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CommunityGroupDialog } from "../create/community-group-dialog";
import { CommunityQueryError } from "../_components/community-query-state";
import { EmptyFeed } from "../_components/community-empty-state";

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function matchesCategory(group: CommunityGroup, category: CommunityDiscoveryCategory): boolean {
  if (category.keywords.length === 0) return true;
  const text = normalize([group.name, group.description, group.country, ...group.places, ...group.tags].join(" "));
  return category.keywords.some((keyword) => text.includes(normalize(keyword)));
}

export function CommunityDiscoveryPage() {
  const [searchQuery, setSearchQuery] = useAtom(communitySearchQueryAtom);
  const [categoryId, setCategoryId] = useAtom(communityDiscoveryCategoryAtom);
  const category = communityDiscoveryCategories.find((item) => item.id === categoryId) ?? communityDiscoveryCategories[0];
  const groupsQuery = useCommunityGroups(searchQuery);
  const groups = useMemo(
    () => groupsQuery.data.filter((group) => matchesCategory(group, category)),
    [groupsQuery.data, category],
  );

  return (
    <CommunityErrorBoundary>
      <div className="mx-auto flex w-full max-w-[76rem] flex-col gap-6 px-4 py-5 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-primary/12 text-primary">
              <Compass className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Explore communities</h1>
              <p className="text-sm text-muted-foreground">
                {groupsQuery.total ? `${groupsQuery.total} communities` : "Find people who travel the way you do"}
                {searchQuery.trim() ? ` matching “${searchQuery.trim()}”` : ""}
              </p>
            </div>
          </div>
          <CommunityGroupDialog />
        </header>

        <div role="group" aria-label="Filter by topic" className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {communityDiscoveryCategories.map((item) => {
            const selected = item.id === category.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setCategoryId(item.id)}
                className={cn(
                  "h-9 shrink-0 rounded-full px-4 text-sm font-semibold ring-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? "bg-foreground text-background ring-foreground"
                    : "bg-card text-foreground ring-border hover:bg-muted",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <CommunityQueryError error={groupsQuery.error} onRetry={() => void groupsQuery.refetch()} />

        {groupsQuery.isLoading ? (
          <div role="status" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <span className="sr-only">Loading communities</span>
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : null}

        {!groupsQuery.isLoading && !groupsQuery.isError && groups.length === 0 ? (
          <EmptyFeed
            title={searchQuery.trim() || category.id !== "all" ? "No communities match" : "No communities yet"}
            body={
              searchQuery.trim() || category.id !== "all"
                ? "Try another topic, or start the community you were looking for."
                : "Start the first one and invite travelers to join."
            }
            actions={
              <>
                {searchQuery.trim() || category.id !== "all" ? (
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() => {
                      setSearchQuery("");
                      setCategoryId("all");
                    }}
                  >
                    Clear filters
                  </Button>
                ) : null}
                <CommunityGroupDialog />
              </>
            }
          />
        ) : null}

        {groups.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <CommunityDiscoveryGroupCard key={group.id} group={group} />
            ))}
          </div>
        ) : null}

        {groupsQuery.hasNextPage ? (
          <Button
            variant="outline"
            className="mx-auto rounded-full"
            disabled={groupsQuery.isFetchingNextPage}
            onClick={() => void groupsQuery.fetchNextPage()}
          >
            {groupsQuery.isFetchingNextPage ? "Loading…" : "Show more communities"}
          </Button>
        ) : null}
      </div>
    </CommunityErrorBoundary>
  );
}

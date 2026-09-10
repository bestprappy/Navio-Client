"use client";

import { useMemo } from "react";
import { Compass, SearchX } from "lucide-react";
import { useAtom, useAtomValue } from "jotai";

import {
  communityDiscoveryCategoryAtom,
  communityDiscoveryVisibleCountsAtom,
  communitySearchQueryAtom,
} from "../_components/community-atoms";
import { CommunityErrorBoundary } from "../_components/community-error-boundary";
import { useCommunityGroups } from "../_components/community-queries";
import type {
  CommunityDiscoveryCategory,
  CommunityGroup,
} from "../_components/data";
import { communityDiscoveryCategories } from "../_components/data";
import { CommunityDiscoveryGroupCard } from "./community-discovery-group-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CommunityGroupDialog } from "../create/community-group-dialog";
import { CommunityQueryError } from "../_components/community-query-state";

const DEFAULT_SECTION_LIMIT = 6;
const SECTION_INCREMENT = 3;

type DiscoverySectionProps = {
  title: string;
  description: string;
  groups: CommunityGroup[];
  visibleCount: number;
  onShowMore: () => void;
};

function normalizeDiscoveryValue(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSelectedCategory(categoryId: string): CommunityDiscoveryCategory {
  return (
    communityDiscoveryCategories.find(
      (category) => category.id === categoryId,
    ) ?? {
      id: "all",
      label: "All",
      keywords: [],
    }
  );
}

function getGroupDiscoveryText(group: CommunityGroup): string {
  return normalizeDiscoveryValue(
    [
      group.name,
      group.description,
      group.country,
      group.isOfficial ? "official" : "",
      ...group.places,
      ...group.tags,
    ].join(" "),
  );
}

function matchesDiscoveryCategory(
  group: CommunityGroup,
  category: CommunityDiscoveryCategory,
): boolean {
  if (category.keywords.length === 0) {
    return true;
  }

  const groupText = getGroupDiscoveryText(group);

  return category.keywords.some((keyword) =>
    groupText.includes(normalizeDiscoveryValue(keyword)),
  );
}

function getSimilarityScore(group: CommunityGroup, anchor: CommunityGroup) {
  const anchorTerms = new Set(
    [anchor.country, ...anchor.places, ...anchor.tags].map(
      normalizeDiscoveryValue,
    ),
  );

  const groupTerms = [group.country, ...group.places, ...group.tags].map(
    normalizeDiscoveryValue,
  );

  return groupTerms.reduce((score, term) => {
    if (!term) {
      return score;
    }

    return score + (anchorTerms.has(term) ? 12 : 0);
  }, group.memberCount / 1000);
}

function getVisibleCount(
  visibleCounts: Record<string, number>,
  sectionId: string,
) {
  return visibleCounts[sectionId] ?? DEFAULT_SECTION_LIMIT;
}

function CommunityDiscoverySection({
  title,
  description,
  groups,
  visibleCount,
  onShowMore,
}: DiscoverySectionProps) {
  const visibleGroups = groups.slice(0, visibleCount);

  if (groups.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4" aria-label={title}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-extrabold tracking-tight text-foreground">
              {title}
            </h2>
            <Badge variant="outline">{groups.length} groups</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {visibleGroups.map((group) => {
          return <CommunityDiscoveryGroupCard key={group.id} group={group} />;
        })}
      </div>

      {groups.length > visibleCount ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="secondary"
            className="rounded-full"
            onClick={onShowMore}
          >
            Show more
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function CommunityDiscoveryLoading() {
  return (
    <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <Card key={index} size="sm" className="min-h-28 rounded-lg">
          <CardContent className="space-y-3 p-3">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-36 rounded-full bg-muted" />
                <div className="h-3 w-24 rounded-full bg-muted" />
              </div>
              <div className="h-8 w-16 rounded-full bg-muted" />
            </div>
            <div className="space-y-2">
              <div className="h-3 rounded-full bg-muted" />
              <div className="h-3 w-3/4 rounded-full bg-muted" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function CommunityDiscoveryPage({
  variant = "discovery",
}: {
  variant?: "discovery" | "popular";
}) {
  const searchQuery = useAtomValue(communitySearchQueryAtom);
  const [selectedCategoryId, setSelectedCategoryId] = useAtom(
    communityDiscoveryCategoryAtom,
  );
  const [visibleCounts, setVisibleCounts] = useAtom(
    communityDiscoveryVisibleCountsAtom,
  );

  const selectedCategory = getSelectedCategory(selectedCategoryId);
  const groupsQuery = useCommunityGroups(searchQuery);
  const groups = useMemo(() => groupsQuery.data, [groupsQuery.data]);

  const joinedGroupIds = useMemo(
    () => groups.filter((group) => group.joined).map((group) => group.id),
    [groups],
  );

  const filteredGroups = useMemo(
    () =>
      groups.filter((group) =>
        matchesDiscoveryCategory(group, selectedCategory),
      ),
    [groups, selectedCategory],
  );

  const recommendedGroups = useMemo(() => {
    const joinedIds = new Set(joinedGroupIds);

    return [...filteredGroups].sort((a, b) => {
      const getScore = (group: CommunityGroup) =>
        (group.isOfficial ? 800 : 0) +
        (joinedIds.has(group.id) ? 120 : 0) +
        group.memberCount / 100;

      return getScore(b) - getScore(a);
    });
  }, [filteredGroups, joinedGroupIds]);

  const recommendedVisibleCount = getVisibleCount(visibleCounts, "recommended");

  const anchorGroup = useMemo(
    () =>
      groups.find((group) => joinedGroupIds.includes(group.id)) ??
      groups[0] ??
      null,
    [groups, joinedGroupIds],
  );

  const similarGroups = useMemo(() => {
    if (!anchorGroup) {
      return [];
    }

    const visibleRecommendedIds = new Set(
      recommendedGroups
        .slice(0, recommendedVisibleCount)
        .map((group) => group.id),
    );

    return filteredGroups
      .filter(
        (group) =>
          group.id !== anchorGroup.id && !visibleRecommendedIds.has(group.id),
      )
      .sort(
        (a, b) =>
          getSimilarityScore(b, anchorGroup) -
          getSimilarityScore(a, anchorGroup),
      );
  }, [anchorGroup, filteredGroups, recommendedGroups, recommendedVisibleCount]);

  function showMore(sectionId: string) {
    setVisibleCounts((previous) => ({
      ...previous,
      [sectionId]: getVisibleCount(previous, sectionId) + SECTION_INCREMENT,
    }));
  }

  return (
    <CommunityErrorBoundary>
      <div className="min-h-full bg-background">
        <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-8 p-4 sm:p-6">
          <header className="flex flex-col gap-5 border-b border-border pb-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Compass className="size-4" aria-hidden="true" />
                  {variant === "popular"
                    ? "Popular communities"
                    : "Community discovery"}
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                  {variant === "popular"
                    ? "Popular Communities"
                    : "Explore Communities"}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Find travel groups that match the routes, places, and planning
                  styles you care about.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary">
                  {groupsQuery.total} communities
                </Badge>
                <CommunityGroupDialog />
              </div>
            </div>

            <div
              className="scrollbar-hide flex gap-2 overflow-x-auto pb-1"
              aria-label="Discovery categories"
            >
              {communityDiscoveryCategories.map((category) => {
                const selected = category.id === selectedCategory.id;

                return (
                  <Button
                    key={category.id}
                    type="button"
                    size="sm"
                    variant={selected ? "secondary" : "outline"}
                    aria-pressed={selected}
                    className={cn(
                      "shrink-0 rounded-full",
                      selected && "shadow-xs",
                    )}
                    onClick={() => setSelectedCategoryId(category.id)}
                  >
                    {category.label}
                  </Button>
                );
              })}
            </div>
          </header>

          {groupsQuery.isLoading ? <CommunityDiscoveryLoading /> : null}
          <CommunityQueryError
            error={groupsQuery.error}
            onRetry={() => void groupsQuery.refetch()}
          />
          {groupsQuery.hasNextPage ? (
            <Button
              variant="outline"
              disabled={groupsQuery.isFetchingNextPage}
              onClick={() => void groupsQuery.fetchNextPage()}
            >
              {groupsQuery.isFetchingNextPage
                ? "Loading..."
                : "Load more communities"}
            </Button>
          ) : null}

          {!groupsQuery.isLoading &&
          !groupsQuery.isError &&
          filteredGroups.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                <SearchX
                  className="size-8 text-muted-foreground"
                  aria-hidden="true"
                />
                <div>
                  <CardTitle>No groups found</CardTitle>
                  <CardDescription className="mt-1">
                    Try another category or clear the community search.
                  </CardDescription>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {!groupsQuery.isLoading &&
          !groupsQuery.isError &&
          filteredGroups.length > 0 ? (
            <div className="flex flex-col gap-8">
              <CommunityDiscoverySection
                title={
                  variant === "popular"
                    ? "Popular groups"
                    : "Recommended for you"
                }
                description="Groups with strong activity and close overlap with your joined communities."
                groups={recommendedGroups}
                visibleCount={recommendedVisibleCount}
                onShowMore={() => showMore("recommended")}
              />

              {similarGroups.length > 0 && anchorGroup ? (
                <CommunityDiscoverySection
                  title={`More like ${anchorGroup.name}`}
                  description="Neighboring groups based on shared places, tags, and route style."
                  groups={similarGroups}
                  visibleCount={getVisibleCount(visibleCounts, "similar")}
                  onShowMore={() => showMore("similar")}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </CommunityErrorBoundary>
  );
}

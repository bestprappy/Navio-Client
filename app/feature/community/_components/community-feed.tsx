"use client";

import { SearchX, Sparkles } from "lucide-react";
import { useAtom } from "jotai";

import { communityFeedSortAtom } from "./community-atoms";
import { CommunityPostCard } from "./community-post-card";
import type {
  CommunityComment,
  CommunityFeedSort,
  CommunityGroup,
  CommunityPost,
} from "./data";
import { getCommentsByPostId, getGroupById, getTripById } from "./data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CommunityFeedProps = {
  posts: CommunityPost[];
  groups: CommunityGroup[];
  extraCommentsByPostId: Record<string, CommunityComment[]>;
  searchQuery: string;
  selectedPostId: string | null;
  isLoading: boolean;
  isError: boolean;
  onSelectPost: (postId: string) => void;
};

const SORT_OPTIONS: { value: CommunityFeedSort; label: string }[] = [
  { value: "best", label: "Best" },
  { value: "new", label: "New" },
  { value: "top", label: "Top" },
];

export function CommunityFeed({
  posts,
  groups,
  extraCommentsByPostId,
  searchQuery,
  selectedPostId,
  isLoading,
  isError,
  onSelectPost,
}: CommunityFeedProps) {
  const [sort, setSort] = useAtom(communityFeedSortAtom);

  return (
    <section className="flex min-w-0 flex-col gap-4" aria-label="Community feed">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Trip discussions
            </h1>
            {searchQuery ? (
              <Badge variant="secondary">Search: {searchQuery}</Badge>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask, compare, copy, and improve trip plans from Navio travelers.
          </p>
        </div>
        <div
          className="inline-flex rounded-lg border border-border bg-card p-1"
          role="tablist"
          aria-label="Sort community feed"
        >
          {SORT_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={sort === option.value ? "secondary" : "ghost"}
              role="tab"
              aria-selected={sort === option.value}
              onClick={() => setSort(option.value)}
              className={cn(sort === option.value && "shadow-xs")}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {isError ? (
        <Card>
          <CardHeader>
            <CardTitle>Feed unavailable</CardTitle>
            <CardDescription>
              The mock community feed could not load. Try refreshing the page.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {isLoading ? (
        <div className="flex flex-col gap-4" aria-label="Loading posts">
          {["one", "two", "three"].map((item) => (
            <Card key={item}>
              <CardContent className="space-y-4 p-5">
                <div className="h-4 w-40 rounded-full bg-muted" />
                <div className="h-6 w-3/4 rounded-full bg-muted" />
                <div className="h-20 rounded-xl bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {!isLoading && !isError && posts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <SearchX className="size-8 text-muted-foreground" aria-hidden="true" />
            <div>
              <h2 className="font-semibold text-foreground">No matches yet</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Try searching for restaurant, restaurant Thailand, Bangkok food,
                or EV charging.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && posts.length > 0 ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="size-3.5" aria-hidden="true" />
            {posts.length} discussion{posts.length === 1 ? "" : "s"} found
          </div>
          <div className="">
            {posts.map((post) => {
              const group = getGroupById(post.groupId, groups);
              const trip = post.sharedTripId
                ? getTripById(post.sharedTripId)
                : null;
              const comments = getCommentsByPostId(
                post.id,
                extraCommentsByPostId[post.id] ?? [],
              );

              return (
                <CommunityPostCard
                  key={post.id}
                  post={post}
                  group={group}
                  trip={trip}
                  comments={comments}
                  selected={selectedPostId === post.id}
                  onSelect={onSelectPost}
                />
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}

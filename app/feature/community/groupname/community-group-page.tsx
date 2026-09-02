"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Bell,
  BellOff,
  Check,
  MoreHorizontal,
  Plus,
  SearchX,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { useAtom, useAtomValue } from "jotai";

import { useRequireAuth } from "@/hooks/use-require-auth";

import {
  communityFeedSortAtom,
  createdGroupsAtom,
  createdPostsAtom,
  extraCommentsByPostIdAtom,
  joinedGroupIdsAtom,
  mutedGroupIdsAtom,
  selectedCommunityPostIdAtom,
} from "../_components/community-atoms";
import { CommunityErrorBoundary } from "../_components/community-error-boundary";
import { CommunityGroupSidebar } from "./_components/community-group-sidebar";
import { CommunityPostCard } from "../_components/community-post-card";
import {
  useCommunityFeed,
  useCommunityGroups,
} from "../_components/community-queries";
import type {
  CommunityComment,
  CommunityFeedSort,
  CommunityGroup,
  CommunityPost,
} from "../_components/data";
import {
  formatCount,
  getCommentsByPostId,
  getGroupBySlug,
  getGroupProfileByGroupId,
  getInitials,
  getTripById,
  mockCommunityGroups,
} from "../_components/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

type CommunityGroupPageProps = {
  groupName: string;
};

const SORT_OPTIONS: { value: CommunityFeedSort; label: string }[] = [
  { value: "best", label: "Best" },
  { value: "new", label: "New" },
  { value: "top", label: "Top" },
];

function getGroupPosts(posts: CommunityPost[], groupId: string) {
  return posts.filter((post) => post.groupId === groupId);
}

function CommunityGroupNotFound({ groupName }: { groupName: string }) {
  return (
    <CommunityErrorBoundary>
      <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-6 p-4 sm:p-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <SearchX
              className="size-8 text-muted-foreground"
              aria-hidden="true"
            />
            <div>
              <CardTitle>Group not found</CardTitle>
              <CardDescription className="mt-1">
                We could not find a community group for {groupName}.
              </CardDescription>
            </div>
            <Link
              href="/community"
              className="inline-flex h-8 items-center justify-center rounded-lg bg-secondary px-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Back to community
            </Link>
          </CardContent>
        </Card>
      </div>
    </CommunityErrorBoundary>
  );
}

function CommunityGroupHero({
  group,
  bannerUrl,
  joined,
  muted,
  onToggleJoin,
  onToggleMuted,
}: {
  group: CommunityGroup;
  bannerUrl: string;
  joined: boolean;
  muted: boolean;
  onToggleJoin: () => void;
  onToggleMuted: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-lg bg-background">
      <div className="relative h-32 bg-muted sm:h-44">
        <img
          src={bannerUrl}
          alt={`${group.name} banner`}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-background/10" aria-hidden="true" />
      </div>

      <div className="px-4 pb-4 sm:px-6 sm:pb-5">
        <div className="flex flex-row items-center justify-between gap-4 pt-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="-mt-12 size-20 shrink-0 border-4 border-background bg-card shadow-sm sm:-mt-14 sm:size-24">
              <AvatarImage src={group.avatarUrl} alt={group.name} />
              <AvatarFallback className="text-xl font-extrabold">
                {getInitials(group.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                  {group.name}
                </h1>
                {group.isOfficial ? (
                  <Badge variant="secondary">Official</Badge>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatCount(group.memberCount)} members -{" "}
                {formatCount(group.postCount)} posts
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/community/create?groupId=${group.id}`}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Plus className="size-4" aria-hidden="true" />
              Create post
            </Link>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={
                muted ? "Turn notifications on" : "Mute notifications"
              }
              aria-pressed={!muted}
              onClick={onToggleMuted}
              className="rounded-full"
            >
              {muted ? (
                <BellOff className="size-4" aria-hidden="true" />
              ) : (
                <Bell className="size-4" aria-hidden="true" />
              )}
            </Button>
            <Button
              type="button"
              variant={joined ? "secondary" : "outline"}
              aria-pressed={joined}
              onClick={onToggleJoin}
              className="rounded-full"
            >
              {joined ? (
                <Check className="size-4" aria-hidden="true" />
              ) : (
                <UserPlus className="size-4" aria-hidden="true" />
              )}
              {joined ? "Joined" : "Join"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="More group actions"
              className="rounded-full"
            >
              <MoreHorizontal className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function CommunityGroupPostFeed({
  group,
  posts,
  extraCommentsByPostId,
  selectedPostId,
  isLoading,
  isError,
  onSelectPost,
}: {
  group: CommunityGroup;
  posts: CommunityPost[];
  extraCommentsByPostId: Record<string, CommunityComment[]>;
  selectedPostId: string | null;
  isLoading: boolean;
  isError: boolean;
  onSelectPost: (postId: string) => void;
}) {
  const [sort, setSort] = useAtom(communityFeedSortAtom);

  return (
    <section
      className="flex min-w-0 flex-col gap-4"
      aria-label={`${group.name} posts`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-extrabold tracking-tight text-foreground">
              Group posts
            </h2>
            <Badge variant="outline">{posts.length} posts</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Discussions from travelers posting inside this group.
          </p>
        </div>

        <div
          className="inline-flex rounded-lg border border-border bg-card p-1"
          role="tablist"
          aria-label="Sort group posts"
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
            <CardTitle>Posts unavailable</CardTitle>
            <CardDescription>
              The mock group feed could not load. Try refreshing the page.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {isLoading ? (
        <div className="flex flex-col gap-4" aria-label="Loading group posts">
          {["one", "two"].map((item) => (
            <Card key={item}>
              <CardContent className="space-y-4 p-5">
                <div className="h-4 w-36 rounded-full bg-muted" />
                <div className="h-6 w-3/4 rounded-full bg-muted" />
                <div className="h-44 rounded-lg bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {!isLoading && !isError && posts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <Sparkles
              className="size-8 text-muted-foreground"
              aria-hidden="true"
            />
            <div>
              <CardTitle>No group posts yet</CardTitle>
              <CardDescription className="mt-1">
                Start a discussion to make this group feel alive.
              </CardDescription>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && posts.length > 0 ? (
        <div className="flex flex-col gap-2">
          {posts.map((post) => {
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
                metaVariant="author"
                showJoinAction={false}
                onSelect={onSelectPost}
              />
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

export function CommunityGroupPage({ groupName }: CommunityGroupPageProps) {
  const { requireAuth } = useRequireAuth();
  const createdGroups = useAtomValue(createdGroupsAtom);
  const createdPosts = useAtomValue(createdPostsAtom);
  const extraCommentsByPostId = useAtomValue(extraCommentsByPostIdAtom);
  const [joinedGroupIds, setJoinedGroupIds] = useAtom(joinedGroupIdsAtom);
  const [mutedGroupIds, setMutedGroupIds] = useAtom(mutedGroupIdsAtom);
  const [selectedPostId, setSelectedPostId] = useAtom(
    selectedCommunityPostIdAtom,
  );
  const sort = useAtomValue(communityFeedSortAtom);

  const groupsQuery = useCommunityGroups("", createdGroups);
  const groups = useMemo(
    () => groupsQuery.data ?? [...createdGroups, ...mockCommunityGroups],
    [createdGroups, groupsQuery.data],
  );
  const group = useMemo(
    () => getGroupBySlug(groupName, groups),
    [groupName, groups],
  );

  const feedQuery = useCommunityFeed(
    "",
    sort,
    createdPosts,
    groups,
    extraCommentsByPostId,
  );

  const groupPosts = useMemo(
    () => (group ? getGroupPosts(feedQuery.data ?? [], group.id) : []),
    [feedQuery.data, group],
  );

  if (!group) {
    return <CommunityGroupNotFound groupName={groupName} />;
  }

  const profile = getGroupProfileByGroupId(group.id, group);
  const groupId = group.id;
  const joined = joinedGroupIds.includes(group.id);
  const muted = mutedGroupIds.includes(group.id);

  function toggleJoin() {
    requireAuth(() => {
      setJoinedGroupIds((previous) =>
        previous.includes(groupId)
          ? previous.filter((id) => id !== groupId)
          : [...previous, groupId],
      );
    });
  }

  function toggleMuted() {
    requireAuth(() => {
      setMutedGroupIds((previous) =>
        previous.includes(groupId)
          ? previous.filter((id) => id !== groupId)
          : [...previous, groupId],
      );
    });
  }

  return (
    <CommunityErrorBoundary>
      <div className="min-h-full bg-background">
        <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-6 p-4 sm:p-6">
          <CommunityGroupHero
            group={group}
            bannerUrl={profile.bannerUrl}
            joined={joined}
            muted={muted}
            onToggleJoin={toggleJoin}
            onToggleMuted={toggleMuted}
          />

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <CommunityGroupPostFeed
              group={group}
              posts={groupPosts}
              extraCommentsByPostId={extraCommentsByPostId}
              selectedPostId={selectedPostId}
              isLoading={feedQuery.isLoading || groupsQuery.isLoading}
              isError={feedQuery.isError || groupsQuery.isError}
              onSelectPost={setSelectedPostId}
            />

            <CommunityGroupSidebar group={group} profile={profile} />
          </div>
        </div>
      </div>
    </CommunityErrorBoundary>
  );
}

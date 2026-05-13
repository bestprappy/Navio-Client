"use client";

import { ArrowBigUpDash, MessageCircle, UserPlus } from "lucide-react";
import { useAtom, useAtomValue } from "jotai";

import {
  createdPostsAtom,
  joinedGroupIdsAtom,
  recentPostsClearedAtom,
} from "./community-atoms";
import type { CommunityGroup, CommunityPost } from "./data";
import {
  formatCount,
  formatRelativeTime,
  getInitials,
  mockCommunityPosts,
} from "./data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CommunityContextSidebarProps = {
  groups: CommunityGroup[];
  joinedGroupIds: string[];
  groupsLoading: boolean;
  groupsError: boolean;
  onToggleJoin: (groupId: string) => void;
};

function CommunityJoinItem({
  group,
  onJoin,
}: {
  group: CommunityGroup;
  onJoin: () => void;
}) {
  return (
    <div className="flex items-center gap-3 hover:bg-muted/70 my-3 p-4 rounded-sm">
      <Avatar className="size-8 shrink-0">
        <AvatarImage src={group.avatarUrl} alt={group.name} />
        <AvatarFallback className="text-[11px] font-semibold">
          {getInitials(group.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {group.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatCount(group.memberCount)} members
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7 shrink-0 px-3 text-xs"
        onClick={onJoin}
        aria-label={`Join ${group.name}`}
      >
        <UserPlus className="size-3" aria-hidden="true" />
        Join
      </Button>
    </div>
  );
}

function RecentPostItem({
  group,
  post,
}: {
  group: CommunityGroup;
  post: CommunityPost;
}) {
  return (
    <div className="flex gap-3 py-2.5">
      <Avatar className="mt-0.5 size-6 shrink-0">
        <AvatarImage src={group.avatarUrl} alt={group.name} />
        <AvatarFallback className="text-[10px]">
          {getInitials(group.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{group.name}</span>
          {" · "}
          {formatRelativeTime(post.createdAt)}
        </p>
        <p className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug text-foreground">
          {post.title}
        </p>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <ArrowBigUpDash className="size-3" aria-hidden="true" />
            {formatCount(post.upvotes)}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="size-3" aria-hidden="true" />
            {formatCount(post.commentCount)}
          </span>
        </div>
      </div>
      {post.imageUrl ? (
        <img
          src={post.imageUrl}
          alt=""
          aria-hidden="true"
          className="size-16 shrink-0 rounded-md object-cover"
        />
      ) : null}
    </div>
  );
}

export function CommunityContextSidebar({
  groups,
  joinedGroupIds,
  groupsLoading,
  groupsError,
  onToggleJoin,
}: CommunityContextSidebarProps) {
  const [cleared, setCleared] = useAtom(recentPostsClearedAtom);
  const createdPosts = useAtomValue(createdPostsAtom);

  const allPosts: CommunityPost[] = [...createdPosts, ...mockCommunityPosts];
  const joinedGroups = groups.filter((g) => joinedGroupIds.includes(g.id));
  const unjoinedGroups = groups.filter((g) => !joinedGroupIds.includes(g.id));

  const recentPostsByGroup = joinedGroups
    .map((group) => ({
      group,
      posts: allPosts
        .filter((p) => p.groupId === group.id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 3),
    }))
    .filter(({ posts }) => posts.length > 0);

  const hasRecentPosts = recentPostsByGroup.length > 0;

  return (
    <aside
      aria-label="Community sidebar"
      className={cn(
        "flex flex-col gap-4",
        "xl:sticky xl:top-6 xl:self-start",
        "xl:max-h-[calc(100dvh-8rem)] xl:overflow-y-auto",
        "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
        "xl:pr-1",
      )}
    >
      {/* Recent Posts */}
      {joinedGroups.length > 0 ? (
        <section
          aria-label="Recent posts from joined communities"
          className="px-4 py-3"
        >
          <div className="mb-1 flex items-center justify-between gap-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Recent Posts
            </h2>
            {!cleared ? (
              <button
                type="button"
                onClick={() => setCleared(true)}
                className="text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                Clear
              </button>
            ) : null}
          </div>

          {!cleared && hasRecentPosts ? (
            <div className="">
              {recentPostsByGroup.map(({ group, posts }) =>
                posts.map((post) => (
                  <RecentPostItem key={post.id} group={group} post={post} />
                )),
              )}
            </div>
          ) : null}

          {cleared || !hasRecentPosts ? (
            <p className="py-2 text-sm text-muted-foreground">
              {cleared
                ? "No recent posts."
                : "No posts yet in your communities."}
            </p>
          ) : null}
        </section>
      ) : null}

      {/* Popular Communities */}
      {unjoinedGroups.length > 0 || groupsLoading || groupsError ? (
        <section
          aria-label="Popular communities"
          className="px-4 py-3"
        >
          <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Popular Communities
          </h2>

          {groupsLoading ? (
            <div className="space-y-3 py-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-muted" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-28 rounded bg-muted" />
                    <div className="h-2.5 w-20 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {groupsError ? (
            <p className="py-2 text-sm text-muted-foreground">
              Could not load communities.
            </p>
          ) : null}

          {!groupsLoading && !groupsError ? (
            <div className="">
              {unjoinedGroups.map((group) => (
                <CommunityJoinItem
                  key={group.id}
                  group={group}
                  onJoin={() => onToggleJoin(group.id)}
                />
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {/* All joined, nothing unjoined */}
      {!groupsLoading &&
      !groupsError &&
      unjoinedGroups.length === 0 &&
      joinedGroups.length > 0 ? (
        <p className="px-1 text-xs text-muted-foreground">
          You've joined all available communities.
        </p>
      ) : null}
    </aside>
  );
}

"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft, SearchX } from "lucide-react";
import { useAtomValue } from "jotai";

import {
  createdPostsAtom,
  extraCommentsByPostIdAtom,
} from "../_components/community-atoms";
import { useCommunityGroup } from "../_components/community-group-queries";
import { toCommunityGroup } from "../_components/community-api";
import {
  CommunityGroupLoading,
  CommunityQueryError,
} from "../_components/community-query-state";
import { CommunityErrorBoundary } from "../_components/community-error-boundary";
import { useCommunityFeed } from "../_components/community-queries";
import {
  getCommentsByPostId,
  getGroupProfileByGroupId,
  getPostByGroupAndSlug,
} from "../_components/data";
import { CommunityCommentThread } from "./_components/community-comment-thread";
import { CommunityGroupSidebar } from "./_components/community-group-sidebar";
import { CommunityPostDetailCard } from "./_components/community-post-detail-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";

type CommunityDiscussionPageProps = {
  groupName: string;
  discussionTitle: string;
};

function NotFoundCard({
  title,
  description,
  href,
  actionLabel,
}: {
  title: string;
  description: string;
  href: string;
  actionLabel: string;
}) {
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
              <CardTitle>{title}</CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
            <Link
              href={href}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-secondary px-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              {actionLabel}
            </Link>
          </CardContent>
        </Card>
      </div>
    </CommunityErrorBoundary>
  );
}

export function CommunityDiscussionPage({
  groupName,
  discussionTitle,
}: CommunityDiscussionPageProps) {
  const createdPosts = useAtomValue(createdPostsAtom);
  const extraCommentsByPostId = useAtomValue(extraCommentsByPostIdAtom);

  const groupsQuery = useCommunityGroup(groupName);
  const groups = useMemo(
    () => (groupsQuery.data ? [toCommunityGroup(groupsQuery.data)] : []),
    [groupsQuery.data],
  );
  const group = groups[0];

  const feedQuery = useCommunityFeed(
    "",
    "best",
    createdPosts,
    groups,
    extraCommentsByPostId,
  );
  const posts = useMemo(() => feedQuery.data ?? [], [feedQuery.data]);
  const post = useMemo(
    () =>
      group ? getPostByGroupAndSlug(group.id, discussionTitle, posts) : null,
    [discussionTitle, group, posts],
  );

  if (groupsQuery.isPending || feedQuery.isLoading)
    return (
      <div className="p-6">
        <CommunityGroupLoading />
      </div>
    );
  if (groupsQuery.error)
    return (
      <div className="p-6">
        <CommunityQueryError
          error={groupsQuery.error}
          onRetry={() => void groupsQuery.refetch()}
        />
      </div>
    );

  if (!group) {
    return (
      <NotFoundCard
        title="Group not found"
        description={`We could not find a community group for ${groupName}.`}
        href="/community"
        actionLabel="Back to community"
      />
    );
  }

  if (!post) {
    return (
      <NotFoundCard
        title="Discussion not found"
        description="That discussion may have moved, or it was created in another group."
        href={`/community/${groupName}`}
        actionLabel={`Back to ${group.name}`}
      />
    );
  }

  const profile = getGroupProfileByGroupId(group.id, group);
  const comments = getCommentsByPostId(
    post.id,
    extraCommentsByPostId[post.id] ?? [],
  );

  return (
    <CommunityErrorBoundary>
      <div className="min-h-full bg-background">
        <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-6 p-4 sm:p-6">
          <p role="status" className="text-sm text-muted-foreground">
            Local preview: posts and comments are visible only in this session
            and are not published.
          </p>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="flex min-w-0 flex-col gap-5">
              <CommunityPostDetailCard
                post={post}
                group={group}
                comments={comments}
              />
              <CommunityCommentThread post={post} comments={comments} />
            </div>

            <CommunityGroupSidebar group={group} profile={profile} />
          </div>
        </div>
      </div>
    </CommunityErrorBoundary>
  );
}

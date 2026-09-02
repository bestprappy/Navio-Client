"use client";

import Link from "next/link";
import {
  ArrowBigDownDash,
  ArrowBigUpDash,
  ArrowLeft,
  MessageCircle,
  Share2,
} from "lucide-react";
import { useAtom } from "jotai";

import {
  downvotedPostIdsAtom,
  upvotedPostIdsAtom,
} from "../../_components/community-atoms";
import { CommunityTripAttachment } from "../../_components/community-trip-attachment";
import { CommunityFlairBadge } from "../../_components/community-flair-badge";
import type {
  CommunityComment,
  CommunityGroup,
  CommunityPost,
} from "../../_components/data";
import {
  formatCount,
  formatRelativeTime,
  getTripById,
  getInitials,
  getUserById,
  slugifyCommunityValue,
} from "../../_components/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { cn } from "@/lib/utils";

type CommunityPostDetailCardProps = {
  post: CommunityPost;
  group: CommunityGroup;
  comments: CommunityComment[];
};

export function CommunityPostDetailCard({
  post,
  group,
  comments,
}: CommunityPostDetailCardProps) {
  const { requireAuth } = useRequireAuth();
  const [upvotedPostIds, setUpvotedPostIds] = useAtom(upvotedPostIdsAtom);
  const [downvotedPostIds, setDownvotedPostIds] = useAtom(downvotedPostIdsAtom);
  const author = getUserById(post.authorId);
  const trip = post.sharedTripId ? getTripById(post.sharedTripId) : null;
  const isUpvoted = upvotedPostIds.includes(post.id);
  const isDownvoted = downvotedPostIds.includes(post.id);
  const score = post.upvotes + (isUpvoted ? 1 : 0) - (isDownvoted ? 1 : 0);
  const commentTotal = post.commentCount + Math.max(0, comments.length);
  const flair = post.flairId
    ? (group.postFlairs.find((item) => item.id === post.flairId) ?? null)
    : null;
  const groupHref = `/community/${slugifyCommunityValue(group.name)}`;

  function toggleUpvote() {
    requireAuth(() => {
      setUpvotedPostIds((previous) =>
        previous.includes(post.id)
          ? previous.filter((id) => id !== post.id)
          : [...previous, post.id],
      );
      setDownvotedPostIds((previous) =>
        previous.filter((id) => id !== post.id),
      );
    });
  }

  function toggleDownvote() {
    requireAuth(() => {
      setDownvotedPostIds((previous) =>
        previous.includes(post.id)
          ? previous.filter((id) => id !== post.id)
          : [...previous, post.id],
      );
      setUpvotedPostIds((previous) =>
        previous.filter((id) => id !== post.id),
      );
    });
  }

  return (
    <Card className="gap-0 rounded-lg py-0">
      <CardContent className="px-4 py-4 sm:px-5">
        <div className="mb-3 flex items-start gap-3">
          <Link
            href={groupHref}
            aria-label={`Back to ${group.name}`}
            className="mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>

          <Avatar className="size-9">
            <AvatarImage src={group.avatarUrl} alt={group.name} />
            <AvatarFallback className="text-xs">
              {getInitials(group.name)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Link
                href={groupHref}
                className="truncate text-sm font-semibold text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {group.name}
              </Link>
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(post.createdAt)}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              @{author.handle}
            </p>
          </div>
        </div>

        <h1 className="text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
          {post.title}
        </h1>

        {flair ? (
          <div className="mt-3">
            <CommunityFlairBadge flair={flair} />
          </div>
        ) : null}

        <p className="mt-4 whitespace-pre-line text-sm leading-6 text-foreground">
          {post.body}
        </p>

        {post.imageUrl ? (
          <div className="relative mt-4 h-[280px] overflow-hidden rounded-lg bg-muted sm:h-[420px]">
            <img
              src={post.imageUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl brightness-75"
            />
            <img
              src={post.imageUrl}
              alt={post.title}
              className="relative z-10 mx-auto h-full w-full object-contain"
            />
          </div>
        ) : null}

        {trip ? (
          <div className="mt-4">
            <CommunityTripAttachment trip={trip} />
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="flex items-center overflow-hidden rounded-full bg-muted">
            <button
              type="button"
              aria-label="Upvote post"
              aria-pressed={isUpvoted}
              onClick={toggleUpvote}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                isUpvoted
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <ArrowBigUpDash
                className="size-3.5"
                fill={isUpvoted ? "currentColor" : "none"}
                aria-hidden="true"
              />
            </button>
            <span
              className={cn(
                "min-w-[2ch] text-center text-xs font-bold",
                isUpvoted
                  ? "text-primary"
                  : isDownvoted
                    ? "text-destructive"
                    : "text-foreground",
              )}
            >
              {formatCount(score)}
            </span>
            <button
              type="button"
              aria-label="Downvote post"
              aria-pressed={isDownvoted}
              onClick={toggleDownvote}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                isDownvoted
                  ? "text-destructive"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <ArrowBigDownDash
                className="size-3.5"
                fill={isDownvoted ? "currentColor" : "none"}
                aria-hidden="true"
              />
            </button>
          </div>

          <a
            href="#discussion"
            className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <MessageCircle className="size-3.5" aria-hidden="true" />
            {formatCount(commentTotal)} discussions
          </a>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <Share2 className="size-3.5" aria-hidden="true" />
            Share
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

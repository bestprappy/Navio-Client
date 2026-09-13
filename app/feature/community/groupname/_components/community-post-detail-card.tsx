"use client";

import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";

import { CommunityTripAttachment } from "../../_components/community-trip-attachment";
import { CommunityFlairBadge } from "../../_components/community-flair-badge";
import {
  CommunitySharePill,
  CommunityVotePill,
} from "../../_components/community-post-actions";
import { CommunityPostEditor } from "../../_components/community-post-editor";
import { useCommunityUserProfile } from "../../_components/community-user-label";
import { useCommunityIdentity } from "../../_components/community-group-queries";
import type { CommunityGroup, CommunityPost } from "../../_components/data";
import {
  formatCount,
  formatRelativeTime,
  getCommunityPostHref,
  getTripById,
  slugifyCommunityValue,
} from "../../_components/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

type CommunityPostDetailCardProps = {
  post: CommunityPost;
  group: CommunityGroup;
};

export function CommunityPostDetailCard({
  post,
  group,
}: CommunityPostDetailCardProps) {
  const { identity } = useCommunityIdentity();
  const author = useCommunityUserProfile(post.authorId);

  const trip = post.sharedTripId ? getTripById(post.sharedTripId) : null;
  const vote = post.viewerVote ?? 0;
  const flair = post.flairId
    ? (group.postFlairs.find((item) => item.id === post.flairId) ?? null)
    : null;
  const groupSlug = post.groupSlug ?? group.slug ?? slugifyCommunityValue(group.name);
  const groupHref = `/community/${groupSlug}`;
  const archived = group.status === "archived";
  const isAuthor = identity === post.authorId;
  const isModerator = group.role === "admin" || group.role === "moderator";

  return (
    <Card className="gap-0 rounded-2xl border-border/60 py-0 shadow-sm">
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
            {group.avatarUrl ? (
              <AvatarImage src={group.avatarUrl} alt="" />
            ) : null}
            <AvatarFallback className="text-xs">
              {group.name.slice(0, 2).toUpperCase()}
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
              <time
                dateTime={post.createdAt}
                className="text-xs text-muted-foreground"
              >
                {formatRelativeTime(post.createdAt)}
              </time>
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {author.name}
            </p>
          </div>
        </div>

        <h1 className="break-words text-xl font-bold leading-snug tracking-tight text-foreground sm:text-2xl">
          {post.title}
        </h1>

        {flair ? (
          <div className="mt-3">
            <CommunityFlairBadge flair={flair} />
          </div>
        ) : null}

        {post.body ? (
          <p className="mt-4 whitespace-pre-line break-words text-sm leading-7 text-foreground">
            {post.body}
          </p>
        ) : null}

        {post.imageUrl ? (
          <div className="relative mt-4 w-full overflow-hidden rounded-xl bg-muted">
            {/* Post pictures are served from the private media proxy, which the image optimizer cannot read. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.imageUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl brightness-75"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.imageUrl}
              alt={post.title}
              className="relative z-10 mx-auto block h-auto max-h-[70vh] w-full object-contain"
            />
          </div>
        ) : null}

        {post.linkUrl ? (
          <a
            href={post.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 block break-all text-sm text-primary underline underline-offset-2"
          >
            {post.linkUrl}
          </a>
        ) : null}

        {trip ? (
          <div className="mt-4">
            <CommunityTripAttachment trip={trip} />
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <CommunityVotePill
            path={`/${post.id}/vote`}
            score={post.upvotes}
            vote={vote}
            disabled={archived}
          />

          <a
            href="#discussion"
            className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <MessageCircle className="size-3.5" aria-hidden="true" />
            {formatCount(post.commentCount)} comments
          </a>

          <CommunitySharePill
            href={getCommunityPostHref(
              { name: group.name, slug: groupSlug },
              post,
            )}
          />

          {archived ? null : (
            <CommunityPostEditor
              post={post}
              canEdit={isAuthor && Boolean(group.joined)}
              canDelete={(isAuthor || isModerator) && Boolean(group.joined)}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

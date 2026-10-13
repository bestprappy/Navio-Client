"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink, MessageCircle } from "lucide-react";

import { CommunityTripAttachment } from "../../_components/community-trip-attachment";
import { CommunityFlairBadge } from "../../_components/community-flair-badge";
import {
  COMMUNITY_PILL_CLASS,
  CommunitySharePill,
  CommunityVotePill,
} from "../../_components/community-post-actions";
import { CommunityPostEditor } from "../../_components/community-post-editor";
import { CommunityPostImage } from "../../_components/community-post-image";
import { linkHost } from "../../_components/community-post-card";
import { CommunityIcon, communityHandle } from "../../_components/community-identity";
import { useCommunityUserProfile } from "../../_components/community-user-label";
import { useCommunityIdentity } from "../../_components/community-group-queries";
import type { CommunityGroup, CommunityPost } from "../../_components/data";
import {
  formatCount,
  formatRelativeTime,
  getCommunityPostHref,
  getTripById,
} from "../../_components/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type CommunityPostDetailCardProps = {
  post: CommunityPost;
  group: CommunityGroup;
};

export function CommunityPostDetailCard({ post, group }: CommunityPostDetailCardProps) {
  const { identity } = useCommunityIdentity();
  const author = useCommunityUserProfile(post.authorId);
  const trip = post.sharedTripId ? getTripById(post.sharedTripId) : null;
  const flair = post.flairId
    ? (group.postFlairs.find((item) => item.id === post.flairId) ?? null)
    : null;
  const groupSlug = post.groupSlug ?? group.slug ?? "";
  const groupHref = `/community/${groupSlug}`;
  const archived = group.status === "archived";
  const isAuthor = identity === post.authorId;
  const isModerator = group.role === "admin" || group.role === "moderator";
  const canWrite = Boolean(group.joined) && !archived;

  return (
    <article aria-labelledby="post-title" className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Link
          href={groupHref}
          aria-label={`Back to ${communityHandle(groupSlug, group.name)}`}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
        </Link>
        <CommunityIcon name={group.name} seed={groupSlug || group.id} src={group.avatarUrl || post.groupIconUrl} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 text-xs">
            <Link
              href={groupHref}
              className="truncate font-bold text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {communityHandle(groupSlug, group.name)}
            </Link>
            <span aria-hidden="true" className="text-muted-foreground">·</span>
            <time dateTime={post.createdAt} className="text-muted-foreground">
              {formatRelativeTime(post.createdAt)}
            </time>
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
            <Avatar size="sm" className="size-4">
              {author.avatarUrl ? <AvatarImage src={author.avatarUrl} alt="" /> : null}
              <AvatarFallback className="text-[0.5rem]">{author.initials}</AvatarFallback>
            </Avatar>
            {author.name}
          </p>
        </div>
        {canWrite ? (
          <CommunityPostEditor post={post} canEdit={isAuthor} canDelete={isAuthor || isModerator} />
        ) : null}
      </div>

      <h1 id="post-title" className="break-words text-2xl font-extrabold leading-tight tracking-tight text-foreground">
        {post.title}
      </h1>

      {flair ? (
        <div>
          <CommunityFlairBadge flair={flair} />
        </div>
      ) : null}

      {post.body ? (
        <p className="whitespace-pre-line break-words text-[0.9375rem] leading-7 text-foreground">{post.body}</p>
      ) : null}

      {post.imageUrl ? <CommunityPostImage src={post.imageUrl} alt={post.title} variant="detail" /> : null}

      {post.linkUrl ? (
        <a
          href={post.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-info/10 text-info">
            <ExternalLink className="size-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block font-semibold text-foreground">{linkHost(post.linkUrl)}</span>
            <span className="block truncate text-xs text-muted-foreground">{post.linkUrl}</span>
          </span>
        </a>
      ) : null}

      {trip ? <CommunityTripAttachment trip={trip} /> : null}

      <div className="flex flex-wrap items-center gap-2">
        <CommunityVotePill path={`/${post.id}/vote`} score={post.upvotes} vote={post.viewerVote ?? 0} disabled={archived} />
        <a href="#discussion" className={COMMUNITY_PILL_CLASS}>
          <MessageCircle className="size-4" aria-hidden="true" />
          {formatCount(post.commentCount)}
          <span className="sr-only">{post.commentCount === 1 ? "comment" : "comments"}</span>
        </a>
        <CommunitySharePill href={getCommunityPostHref({ name: group.name, slug: groupSlug }, post)} />
      </div>
    </article>
  );
}

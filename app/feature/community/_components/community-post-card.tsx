"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, MessageCircle } from "lucide-react";

import { CommunityMembershipButton } from "./community-membership-button";
import { CommunityFlairBadge } from "./community-flair-badge";
import { CommunityTripAttachment } from "./community-trip-attachment";
import {
  COMMUNITY_PILL_CLASS,
  CommunityVotePill,
  CommunitySharePill,
} from "./community-post-actions";
import { CommunityPostEditor } from "./community-post-editor";
import { CommunityPostImage } from "./community-post-image";
import { CommunityIcon, communityHandle } from "./community-identity";
import { useCommunityIdentity } from "./community-group-queries";
import { useCommunityUserProfile } from "./community-user-label";
import type { CommunityGroup, CommunityPost } from "./data";
import {
  formatCount,
  formatRelativeTime,
  getCommunityPostHref,
  getTripById,
} from "./data";

type CommunityPostCardProps = {
  post: CommunityPost;
  group: CommunityGroup | null;
  /** "group" leads with the community (feeds); "author" leads with the poster (inside a community). */
  metaVariant?: "group" | "author";
  showJoinAction?: boolean;
};

export function linkHost(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function CommunityPostCard({
  post,
  group,
  metaVariant = "group",
  showJoinAction = true,
}: CommunityPostCardProps) {
  const router = useRouter();
  const { identity } = useCommunityIdentity();
  const author = useCommunityUserProfile(post.authorId);

  const groupName = post.groupName ?? group?.name ?? "Community";
  const groupSlug = post.groupSlug ?? group?.slug ?? null;
  const groupHref = groupSlug ? `/community/${groupSlug}` : "/community";
  const postHref = groupSlug
    ? getCommunityPostHref({ name: groupName, slug: groupSlug }, post)
    : null;
  const trip = post.sharedTripId ? getTripById(post.sharedTripId) : null;
  const flair = post.flairId
    ? (group?.postFlairs.find((item) => item.id === post.flairId) ?? null)
    : null;
  const archived = group?.status === "archived";
  const isAuthor = identity === post.authorId;
  // The home feed only loads one page of groups, so a post's group may be unknown here.
  // Authors still get their controls; the service rejects them if they are no longer a member.
  const canWrite = group ? Boolean(group.joined) && !archived : isAuthor;
  const isModerator = group?.role === "admin" || group?.role === "moderator";
  const showGroup = metaVariant === "group";

  function openPost() {
    if (postHref) router.push(postHref);
  }

  return (
    <article
      aria-labelledby={`post-title-${post.id}`}
      className="group/post relative cursor-pointer rounded-xl px-3 py-3 transition-colors hover:bg-muted/60 sm:px-4"
      onClick={openPost}
    >
      <div className="mb-1.5 flex min-w-0 items-center gap-2 text-xs">
        {showGroup ? (
          <Link
            href={groupHref}
            onClick={(event) => event.stopPropagation()}
            className="relative z-10 flex min-w-0 items-center gap-1.5 rounded-full font-bold text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CommunityIcon
              name={groupName}
              seed={groupSlug ?? groupName}
              src={post.groupIconUrl || group?.avatarUrl}
              size="sm"
            />
            <span className="truncate">{communityHandle(groupSlug ?? undefined, groupName)}</span>
          </Link>
        ) : (
          <span className="flex min-w-0 items-center gap-1.5 font-semibold text-foreground">
            <span className="truncate">{author.name}</span>
          </span>
        )}
        <span aria-hidden="true" className="text-muted-foreground">
          ·
        </span>
        <time dateTime={post.createdAt} className="shrink-0 text-muted-foreground">
          {formatRelativeTime(post.createdAt)}
        </time>
        {showGroup ? (
          <span className="hidden min-w-0 truncate text-muted-foreground sm:inline">
            by {author.name}
          </span>
        ) : null}

        <div
          className="relative z-10 ml-auto flex shrink-0 items-center gap-1"
          onClick={(event) => event.stopPropagation()}
        >
          {group && showJoinAction && !archived && !group.joined ? (
            <CommunityMembershipButton group={group} compact />
          ) : null}
          {canWrite ? (
            <CommunityPostEditor
              post={post}
              canEdit={isAuthor}
              canDelete={isAuthor || isModerator}
              redirectOnDelete={false}
            />
          ) : null}
        </div>
      </div>

      <h2
        id={`post-title-${post.id}`}
        className="text-lg font-bold leading-snug tracking-tight text-foreground"
      >
        {postHref ? (
          <Link
            href={postHref}
            onClick={(event) => event.stopPropagation()}
            className="break-words rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {post.title}
          </Link>
        ) : (
          <span className="break-words">{post.title}</span>
        )}
      </h2>

      {flair ? (
        <div className="mt-1.5">
          <CommunityFlairBadge flair={flair} />
        </div>
      ) : null}

      {post.body && !post.imageUrl ? (
        <p className="mt-1.5 line-clamp-3 break-words text-sm leading-6 text-muted-foreground">
          {post.body}
        </p>
      ) : null}

      {post.imageUrl ? (
        <CommunityPostImage src={post.imageUrl} alt={post.title} variant="feed" className="mt-2.5" />
      ) : null}

      {post.linkUrl ? (
        <a
          href={post.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => event.stopPropagation()}
          className="relative z-10 mt-2.5 inline-flex max-w-full items-center gap-1.5 rounded-full bg-info/10 px-3 py-1 text-xs font-semibold text-info hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{linkHost(post.linkUrl)}</span>
        </a>
      ) : null}

      {trip ? (
        <div className="relative z-10 mt-2.5" onClick={(event) => event.stopPropagation()}>
          <CommunityTripAttachment trip={trip} />
        </div>
      ) : null}

      <div
        className="relative z-10 mt-2.5 flex flex-wrap items-center gap-2"
        onClick={(event) => event.stopPropagation()}
      >
        <CommunityVotePill
          path={`/${post.id}/vote`}
          score={post.upvotes}
          vote={post.viewerVote ?? 0}
          disabled={archived}
        />
        <button type="button" onClick={openPost} className={COMMUNITY_PILL_CLASS}>
          <MessageCircle className="size-4" aria-hidden="true" />
          {formatCount(post.commentCount)}
          <span className="sr-only">
            {post.commentCount === 1 ? "comment" : "comments"}
          </span>
        </button>
        {postHref ? <CommunitySharePill href={postHref} /> : null}
      </div>
    </article>
  );
}

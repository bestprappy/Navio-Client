"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dot, MessageCircle } from "lucide-react";
import { useAtom } from "jotai";

import { selectedCommunityPostIdAtom } from "./community-atoms";
import { CommunityMembershipButton } from "./community-membership-button";
import { CommunityFlairBadge } from "./community-flair-badge";
import { CommunityTripAttachment } from "./community-trip-attachment";
import { CommunityVotePill, CommunitySharePill } from "./community-post-actions";
import { useCommunityUserProfile } from "./community-user-label";
import type { CommunityGroup, CommunityPost } from "./data";
import {
  formatCount,
  formatRelativeTime,
  getCommunityPostHref,
  getInitials,
  getTripById,
  slugifyCommunityValue,
} from "./data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type CommunityPostCardProps = {
  post: CommunityPost;
  group: CommunityGroup | null;
  /** "group" shows the community in the meta row, "author" shows the poster. */
  metaVariant?: "group" | "author";
  showJoinAction?: boolean;
};

export function CommunityPostCard({
  post,
  group,
  metaVariant = "group",
  showJoinAction = true,
}: CommunityPostCardProps) {
  const router = useRouter();
  const author = useCommunityUserProfile(post.authorId);
  const [selectedPostId, setSelectedPostId] = useAtom(
    selectedCommunityPostIdAtom,
  );

  const selected = selectedPostId === post.id;
  const groupName = post.groupName ?? group?.name ?? "Unknown group";
  const groupSlug =
    post.groupSlug ?? group?.slug ?? (group ? slugifyCommunityValue(group.name) : null);
  const showGroupMeta = metaVariant === "group";
  const metaName = showGroupMeta ? groupName : author.name;
  const metaAvatarUrl = showGroupMeta ? group?.avatarUrl : author.avatarUrl;
  const metaInitials = showGroupMeta ? getInitials(groupName) : author.initials;
  const groupHref = groupSlug ? `/community/${groupSlug}` : "/community";
  const postHref = groupSlug
    ? getCommunityPostHref({ name: groupName, slug: groupSlug }, post)
    : null;
  const trip = post.sharedTripId ? getTripById(post.sharedTripId) : null;
  const flair = post.flairId
    ? (group?.postFlairs.find((item) => item.id === post.flairId) ?? null)
    : null;
  const archived = group?.status === "archived";

  function openPost() {
    setSelectedPostId(post.id);

    if (postHref) {
      router.push(postHref);
    }
  }

  return (
    <article
      aria-current={selected ? "true" : undefined}
      aria-labelledby={`post-title-${post.id}`}
      className={cn(
        "mb-3 cursor-pointer rounded-lg border border-transparent bg-background px-4 py-3 transition-colors hover:border-border/70 hover:bg-muted/35 focus-within:border-border sm:px-5",
        selected && "border-border bg-muted/35",
      )}
      onClick={openPost}
    >
      {/* Meta row */}
      <div className="mb-2 flex min-w-0 items-center gap-2">
        {showGroupMeta && groupSlug ? (
          <Link
            href={groupHref}
            className="flex min-w-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            onClick={(event) => event.stopPropagation()}
          >
            <Avatar className="size-6">
              {metaAvatarUrl ? <AvatarImage src={metaAvatarUrl} alt="" /> : null}
              <AvatarFallback className="text-[10px]">
                {metaInitials}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-xs font-semibold text-foreground">
              {metaName}
            </span>
          </Link>
        ) : (
          <div className="flex min-w-0 items-center gap-2">
            <Avatar className="size-6">
              {metaAvatarUrl ? <AvatarImage src={metaAvatarUrl} alt="" /> : null}
              <AvatarFallback className="text-[10px]">
                {metaInitials}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-xs font-semibold text-foreground">
              {metaName}
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
          <Dot className="size-3" aria-hidden="true" />
          <time dateTime={post.createdAt}>
            {formatRelativeTime(post.createdAt)}
          </time>
        </div>

        {group && showJoinAction && !archived ? (
          <div className="ml-auto" onClick={(event) => event.stopPropagation()}>
            <CommunityMembershipButton group={group} />
          </div>
        ) : null}
      </div>

      {/* Title — the keyboard and screen-reader path into the post. */}
      <h2
        id={`post-title-${post.id}`}
        className="mb-2 text-base font-semibold leading-snug text-foreground sm:text-lg"
      >
        {postHref ? (
          <Link
            href={postHref}
            onClick={(event) => {
              event.stopPropagation();
              setSelectedPostId(post.id);
            }}
            className="break-words rounded-md hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {post.title}
          </Link>
        ) : (
          <span className="break-words">{post.title}</span>
        )}
      </h2>

      {/* Flair */}
      {flair ? (
        <div className="mb-3">
          <CommunityFlairBadge flair={flair} />
        </div>
      ) : null}

      {/* Body */}
      {post.body ? (
        <p className="mb-3 line-clamp-3 break-words text-sm leading-6 text-muted-foreground">
          {post.body}
        </p>
      ) : null}

      {/* Image */}
      {post.imageUrl ? (
        <div className="relative mb-3 h-[220px] overflow-hidden rounded-lg border border-border/60 bg-muted sm:h-[320px]">
          {/* Post pictures come from the private media proxy, which the image optimizer cannot read. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.imageUrl}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl brightness-75"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.imageUrl}
            alt={post.title}
            loading="lazy"
            className="relative z-10 mx-auto h-full w-full object-contain"
          />
        </div>
      ) : null}

      {post.linkUrl ? (
        <a
          href={post.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => event.stopPropagation()}
          className="mb-3 block break-all text-sm text-primary underline underline-offset-2"
        >
          {post.linkUrl}
        </a>
      ) : null}

      {trip ? (
        <div className="mb-3" onClick={(event) => event.stopPropagation()}>
          <CommunityTripAttachment trip={trip} />
        </div>
      ) : null}

      <div
        className="flex flex-wrap items-center gap-1"
        onClick={(event) => event.stopPropagation()}
      >
        <CommunityVotePill
          path={`/${post.id}/vote`}
          score={post.upvotes}
          vote={post.viewerVote ?? 0}
          disabled={archived}
        />

        <button
          type="button"
          onClick={openPost}
          className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <MessageCircle className="size-3.5" aria-hidden="true" />
          {formatCount(post.commentCount)} discussions
        </button>

        {postHref ? <CommunitySharePill href={postHref} /> : null}
      </div>
    </article>
  );
}

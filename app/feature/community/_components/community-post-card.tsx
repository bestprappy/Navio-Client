"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowBigDownDash,
  ArrowBigUpDash,
  Check,
  Dot,
  MessageCircle,
  Share2,
  UserPlus,
} from "lucide-react";
import { useAtom } from "jotai";

import { CommunityFlairBadge } from "./community-flair-badge";
import {
  downvotedPostIdsAtom,
  joinedGroupIdsAtom,
  upvotedPostIdsAtom,
} from "./community-atoms";
import type {
  CommunityComment,
  CommunityGroup,
  CommunityPost,
  SharedTrip,
} from "./data";
import {
  formatCount,
  formatRelativeTime,
  getCommunityPostHref,
  getInitials,
  getUserById,
  slugifyCommunityValue,
} from "./data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CommunityPostCardProps = {
  post: CommunityPost;
  group: CommunityGroup | null;
  trip: SharedTrip | null;
  comments: CommunityComment[];
  selected: boolean;
  metaVariant?: "group" | "author";
  showJoinAction?: boolean;
  onSelect: (postId: string) => void;
};

export function CommunityPostCard({
  post,
  group,
  comments,
  selected,
  metaVariant = "group",
  showJoinAction = true,
  onSelect,
}: CommunityPostCardProps) {
  const router = useRouter();
  const [upvotedPostIds, setUpvotedPostIds] = useAtom(upvotedPostIdsAtom);
  const [downvotedPostIds, setDownvotedPostIds] = useAtom(downvotedPostIdsAtom);
  const [joinedGroupIds, setJoinedGroupIds] = useAtom(joinedGroupIdsAtom);

  const isUpvoted = upvotedPostIds.includes(post.id);
  const isDownvoted = downvotedPostIds.includes(post.id);
  const isJoined = group ? joinedGroupIds.includes(group.id) : false;
  const score = post.upvotes + (isUpvoted ? 1 : 0) - (isDownvoted ? 1 : 0);
  const commentTotal = post.commentCount + Math.max(0, comments.length);
  const groupName = group?.name ?? "Unknown group";
  const author = getUserById(post.authorId);
  const showGroupMeta = metaVariant === "group";
  const metaName = showGroupMeta ? groupName : `@${author.handle}`;
  const metaAvatarUrl = showGroupMeta ? group?.avatarUrl : author.avatarUrl;
  const metaAvatarAlt = showGroupMeta ? groupName : author.name;
  const metaInitials = getInitials(showGroupMeta ? groupName : author.name);
  const groupHref = group
    ? `/community/${slugifyCommunityValue(group.name)}`
    : "/community";
  const postHref = group ? getCommunityPostHref(group, post) : null;

  const flair = post.flairId
    ? (group?.postFlairs.find((f) => f.id === post.flairId) ?? null)
    : null;

  function toggleUpvote() {
    setUpvotedPostIds((prev) =>
      prev.includes(post.id)
        ? prev.filter((id) => id !== post.id)
        : [...prev, post.id],
    );
    setDownvotedPostIds((prev) => prev.filter((id) => id !== post.id));
  }

  function toggleDownvote() {
    setDownvotedPostIds((prev) =>
      prev.includes(post.id)
        ? prev.filter((id) => id !== post.id)
        : [...prev, post.id],
    );
    setUpvotedPostIds((prev) => prev.filter((id) => id !== post.id));
  }

  function toggleJoin() {
    if (!group) return;
    setJoinedGroupIds((prev) =>
      prev.includes(group.id)
        ? prev.filter((id) => id !== group.id)
        : [...prev, group.id],
    );
  }

  function openPost() {
    onSelect(post.id);

    if (postHref) {
      router.push(postHref);
    }
  }

  return (
    <div
      role="article"
      tabIndex={0}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "mb-3 cursor-pointer rounded-lg bg-background px-4 py-3 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:px-5",
        selected && "bg-muted/40",
      )}
      onClick={openPost}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openPost();
        }
      }}
    >
      {/* Meta row */}
      <div className="mb-2 flex items-center gap-2">
        {showGroupMeta && group ? (
          <Link
            href={groupHref}
            className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <Avatar className="size-6">
              <AvatarImage src={metaAvatarUrl} alt={metaAvatarAlt} />
              <AvatarFallback className="text-[10px]">
                {metaInitials}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-semibold text-foreground">
              {metaName}
            </span>
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <Avatar className="size-6">
              <AvatarImage src={metaAvatarUrl} alt={metaAvatarAlt} />
              <AvatarFallback className="text-[10px]">
                {metaInitials}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-semibold text-foreground">
              {metaName}
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
          <Dot className="size-3" />
          <span>{formatRelativeTime(post.createdAt)}</span>
        </div>
        {group && showJoinAction ? (
          <Button
            type="button"
            size="sm"
            variant={isJoined ? "secondary" : "outline"}
            aria-pressed={isJoined}
            onClick={(e) => {
              e.stopPropagation();
              toggleJoin();
            }}
            className="ml-auto hidden h-7 px-3 text-xs sm:inline-flex"
          >
            {isJoined ? (
              <Check className="size-3" aria-hidden="true" />
            ) : (
              <UserPlus className="size-3" aria-hidden="true" />
            )}
            {isJoined ? "Joined" : "Join"}
          </Button>
        ) : null}
      </div>

      {/* Title */}
      <h2 className="mb-2 text-2xl font-semibold leading-snug text-foreground sm:text-[15px]">
        {post.title}
      </h2>

      {/* Flair */}
      {flair ? (
        <div className="mb-3">
          <CommunityFlairBadge flair={flair} />
        </div>
      ) : null}

      {/* Body */}
      <p className="mb-3 text-sm leading-6 text-muted-foreground line-clamp-3">
        {post.body}
      </p>

      {/* Image */}
      {post.imageUrl ? (
        <div className="relative mb-3 h-[280px] overflow-hidden rounded-lg sm:h-[320px]">
          {/* Blurred background fill */}
          <img
            src={post.imageUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl brightness-75"
          />
          {/* Foreground: contained, centered */}
          <img
            src={post.imageUrl}
            alt={post.title}
            className="relative z-10 mx-auto h-full w-full object-contain"
          />
        </div>
      ) : null}

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-1">
        {/* Vote pill */}
        <div
          className="flex items-center overflow-hidden rounded-full bg-muted"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            aria-label="Upvote"
            aria-pressed={isUpvoted}
            onClick={toggleUpvote}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-accent",
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
            aria-label="Downvote"
            aria-pressed={isDownvoted}
            onClick={toggleDownvote}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-accent",
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

        {/* Comments */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openPost();
          }}
          className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-foreground transition-colors"
        >
          <MessageCircle className="size-3.5" aria-hidden="true" />
          {formatCount(commentTotal)} discussions
        </button>

        {/* Share */}
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-foreground transition-colors"
        >
          <Share2 className="size-3.5" aria-hidden="true" />
          Share
        </button>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCommunityIdentity } from "./community-group-queries";
import { CommunityUserLabel } from "./community-user-label";
import { CommunityFlairBadge } from "./community-flair-badge";
import { CommunityTripAttachment } from "./community-trip-attachment";
import { CommunityVoteButtons, CommunityShareButton } from "./community-post-actions";
import { CommunityPostEditor } from "./community-post-editor";
import { formatRelativeTime, getCommunityPostHref, getTripById, type CommunityPost, type CommunityGroup } from "./data";

type CommunityPostCardProps = {
  post: CommunityPost; group: CommunityGroup | null; detail?: boolean;
};

export function CommunityPostCard({ post, group, detail = false }: CommunityPostCardProps) {
  const { identity } = useCommunityIdentity();
  const groupSlug = post.groupSlug ?? group?.slug ?? "";
  const groupName = post.groupName ?? group?.name ?? "Community";
  const href = getCommunityPostHref({ name: groupName, slug: groupSlug }, post);
  const flair = group?.postFlairs.find((item) => item.id === post.flairId);
  const trip = post.sharedTripId ? getTripById(post.sharedTripId) : null;
  const author = identity === post.authorId;
  const moderator = group?.role === "admin" || group?.role === "moderator";
  return <Card className="min-w-0 gap-3 overflow-hidden">
    <CardHeader className="gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <Link href={`/community/${groupSlug}`} className="font-semibold hover:underline">{groupName}</Link>
        <time dateTime={post.createdAt} className="text-xs text-muted-foreground">{formatRelativeTime(post.createdAt)}</time>
      </div>
      <CommunityUserLabel userId={post.authorId} />
      {detail ? <h1 className="break-words text-2xl font-bold">{post.title}</h1> :
        <h2 className="break-words text-lg font-semibold"><Link href={href} className="hover:underline">{post.title}</Link></h2>}
      {flair ? <CommunityFlairBadge flair={flair} /> : null}
    </CardHeader>
    <CardContent className="space-y-4">
      <p className={`whitespace-pre-wrap break-words text-sm leading-7 ${detail ? "" : "line-clamp-4"}`}>{post.body}</p>
      {post.imageUrl ? <Link href={href} tabIndex={detail ? -1 : 0} aria-label={`Open ${post.title}`}>
        <Image src={post.imageUrl} unoptimized width={1200} height={675} alt={post.title} loading={detail ? "eager" : "lazy"} className="max-h-96 w-full rounded-lg bg-muted object-contain" />
      </Link> : null}
      {post.linkUrl ? <a href={post.linkUrl} target="_blank" rel="noopener noreferrer" className="block break-all text-sm text-primary underline">{post.linkUrl}</a> : null}
      {trip ? <CommunityTripAttachment trip={trip} /> : null}
    </CardContent>
    <CardFooter className="flex flex-wrap items-start gap-2">
      <CommunityVoteButtons path={`/${post.id}/vote`} score={post.upvotes} vote={post.viewerVote ?? 0} disabled={group?.status === "archived"} />
      <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={detail ? "#discussion" : href} />}>
        <MessageCircle />{post.commentCount} comments
      </Button>
      <CommunityShareButton href={href} />
      {detail && group?.status !== "archived" ? <CommunityPostEditor post={post} canEdit={author && Boolean(group?.joined)} canDelete={(author || moderator) && Boolean(group?.joined)} /> : null}
    </CardFooter>
  </Card>;
}

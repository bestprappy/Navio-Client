"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { PublishedGuideSummary } from "./user-guides-api";

export function GuideAuthor({
  author,
  onMedia = false,
}: {
  author: PublishedGuideSummary["author"];
  onMedia?: boolean;
}) {
  const initials = author.displayName.trim().split(/\s+/).slice(0, 2).map((name) => name[0]).join("").toLocaleUpperCase();
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <Avatar size={onMedia ? "default" : "sm"}>
        <AvatarImage
          src={author.id && author.avatarMediaId ? `/api/users/${author.id}/picture?v=${author.avatarMediaId}` : undefined}
          alt={`${author.displayName}'s profile picture`}
        />
        <AvatarFallback className={cn(onMedia && "bg-on-media/20 text-on-media")}>
          {initials || "T"}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0 wrap-anywhere">By {author.displayName}</span>
    </span>
  );
}

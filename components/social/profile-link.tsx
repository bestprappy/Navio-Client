"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { useAccountProfile, useViewer } from "@/hooks/use-social";
import { ApiError } from "@/lib/api-client";
import { avatarUrl, profilePath } from "@/lib/social-api";
import { cn } from "@/lib/utils";
import { UserAvatar } from "./user-avatar";

export type ResolvedAuthor = {
  name: string;
  username: string | null;
  avatarUrl: string | null;
  isViewer: boolean;
  /** The account no longer exists; shown without a link. */
  deleted: boolean;
  loading: boolean;
};

/** Name, handle and photo for any account id, for author labels across Navio. */
export function useResolvedAuthor(accountId: string | null | undefined): ResolvedAuthor {
  const viewer = useViewer();
  const profile = useAccountProfile(accountId);
  const isViewer = !!accountId && viewer.accountId === accountId;
  const deleted = profile.error instanceof ApiError && (profile.error.status === 404 || profile.error.status === 410);
  const name = deleted ? "Deleted account" : profile.data?.displayName || (isViewer ? "You" : "Traveler");
  return {
    name,
    username: deleted ? null : profile.data?.username ?? null,
    avatarUrl: profile.data ? avatarUrl(profile.data) : null,
    isViewer,
    deleted,
    loading: profile.isPending && viewer.signedIn && !!accountId,
  };
}

type ProfileLinkProps = {
  username: string | null;
  children: ReactNode;
  className?: string;
  /** Accessible label when the children are only an avatar. */
  label?: string;
};

/** Links to a public profile when the handle is known; plain text otherwise. */
export function ProfileLink({ username, children, className, label }: ProfileLinkProps) {
  if (!username) return <span className={className}>{children}</span>;
  return (
    <Link
      href={profilePath(username)}
      aria-label={label}
      // Post cards open the post on click; following an author link must not also do that.
      onClick={(event) => event.stopPropagation()}
      className={cn(
        "rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        className,
      )}
    >
      {children}
    </Link>
  );
}

type AuthorChipProps = {
  accountId: string;
  size?: "sm" | "default";
  /** Extra text after the name, such as a timestamp. */
  trailing?: ReactNode;
  className?: string;
};

/** Avatar plus name, both linking to the author's public profile. */
export function AuthorChip({ accountId, size = "sm", trailing, className }: AuthorChipProps) {
  const author = useResolvedAuthor(accountId);
  return (
    <span className={cn("flex min-w-0 items-center gap-2", className)}>
      <ProfileLink username={author.username} label={`${author.name}'s profile`} className="shrink-0 rounded-full hover:no-underline">
        <UserAvatar name={author.name} src={author.avatarUrl} size={size} />
      </ProfileLink>
      <span className="min-w-0 truncate text-sm">
        <ProfileLink username={author.username} className="font-medium text-foreground">
          {author.name}
        </ProfileLink>
        {trailing}
      </span>
    </span>
  );
}

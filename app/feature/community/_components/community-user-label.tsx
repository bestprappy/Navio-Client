"use client";

import { AuthorChip, useResolvedAuthor } from "@/components/social/profile-link";
import { getInitials } from "./data";

export type CommunityUserProfile = {
  name: string;
  username: string | null;
  avatarUrl: string | null;
  initials: string;
  isViewer: boolean;
};

/**
 * Resolves a community author id to a display name, handle and avatar. Shared
 * by the post cards and the comment tree so a member renders identically
 * everywhere, and backed by the same cache as every other author label.
 */
export function useCommunityUserProfile(userId: string): CommunityUserProfile {
  const author = useResolvedAuthor(userId);
  return {
    name: author.name,
    username: author.username,
    avatarUrl: author.avatarUrl,
    initials: getInitials(author.name) || author.name.slice(0, 2).toUpperCase(),
    isViewer: author.isViewer,
  };
}

/** Avatar and name linking to the member's public profile. */
export function CommunityUserLabel({ userId }: { userId: string }) {
  return <AuthorChip accountId={userId} />;
}

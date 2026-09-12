"use client";

import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCommunityIdentity } from "./community-group-queries";
import { getCommunityUser } from "./community-user-api";
import { getInitials } from "./data";

export type CommunityUserProfile = {
  name: string;
  avatarUrl: string | null;
  initials: string;
  isViewer: boolean;
};

/**
 * Resolves a community author id to a display name and avatar. Shared by the
 * post cards and the comment tree so a member renders identically everywhere.
 */
export function useCommunityUserProfile(userId: string): CommunityUserProfile {
  const { identity, authenticated } = useCommunityIdentity();
  const profile = useQuery({
    queryKey: ["community-user", identity, userId],
    queryFn: ({ signal }) => getCommunityUser(userId, signal),
    enabled: authenticated,
    staleTime: 5 * 60_000,
    retry: false,
  });
  const isViewer = identity === userId;
  const name = profile.data?.displayName || (isViewer ? "You" : "Traveler");
  return {
    name,
    avatarUrl: profile.data?.avatarMediaId
      ? `/api/users/${profile.data.id}/picture?v=${profile.data.avatarMediaId}`
      : null,
    initials: getInitials(name) || name.slice(0, 2).toUpperCase(),
    isViewer,
  };
}

export function CommunityUserLabel({ userId }: { userId: string }) {
  const { name, avatarUrl, initials } = useCommunityUserProfile(userId);
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Avatar size="sm">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <span className="min-w-0 break-words text-sm text-muted-foreground">
        {name}
      </span>
    </span>
  );
}

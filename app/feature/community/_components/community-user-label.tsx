"use client";

import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCommunityIdentity } from "./community-group-queries";
import { getCommunityUser } from "./community-user-api";

export function CommunityUserLabel({ userId }: { userId: string }) {
  const { identity, authenticated } = useCommunityIdentity();
  const profile = useQuery({
    queryKey: ["community-user", identity, userId],
    queryFn: ({ signal }) => getCommunityUser(userId, signal),
    enabled: authenticated,
    staleTime: 5 * 60_000,
    retry: false,
  });
  const name = profile.data?.displayName || (identity === userId ? "You" : "Traveler");
  return <span className="flex min-w-0 items-center gap-2">
    <Avatar size="sm">
      {profile.data?.avatarMediaId ? <AvatarImage src={`/api/users/${profile.data.id}/picture?v=${profile.data.avatarMediaId}`} alt="" /> : null}
      <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
    </Avatar>
    <span className="min-w-0 break-words text-sm text-muted-foreground">{name}</span>
  </span>;
}

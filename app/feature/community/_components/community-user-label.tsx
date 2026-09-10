"use client";

import { useQuery } from "@tanstack/react-query";
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
  return (
    <span className="min-w-0 space-y-1">
      {profile.data?.displayName ? (
        <span className="block break-words text-sm font-medium text-foreground">
          {profile.data.displayName}
        </span>
      ) : null}
      <span className="block break-all text-xs text-muted-foreground">
        {userId}
      </span>
      {profile.isError ? (
        <span className="block text-xs text-muted-foreground">
          Name unavailable
        </span>
      ) : null}
    </span>
  );
}

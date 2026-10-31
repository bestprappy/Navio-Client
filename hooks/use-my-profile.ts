"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useViewer } from "@/hooks/use-social";
import { currentUserProfileQueryKey, getMyProfile } from "@/lib/profile-api";
import type { UserProfile } from "@/types/profile";

/**
 * The signed-in traveller's own profile. Same key as the navbar and the
 * profile menu, so a save anywhere updates every place the name or photo shows.
 */
export function useMyProfile() {
  const viewer = useViewer();
  const client = useQueryClient();
  const queryKey = currentUserProfileQueryKey(viewer.accountId);
  const query = useQuery({
    queryKey,
    queryFn: getMyProfile,
    enabled: viewer.signedIn,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const replace = useCallback(
    async (profile: UserProfile) => {
      client.setQueryData(queryKey, profile);
      // Author labels, profile pages and community cards read the public copy.
      await client.invalidateQueries({ queryKey: ["community-user"] });
      await client.invalidateQueries({ queryKey: ["social", "profile"] });
    },
    // queryKey is rebuilt each render from stable parts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [client, viewer.accountId],
  );

  /** The session ended (for example a failed token refresh): show sign-in, never a permanent skeleton. */
  const sessionExpired = !viewer.loading && !viewer.signedIn;
  return { ...query, viewer, replace, sessionExpired };
}

"use client";

import { useQuery } from "@tanstack/react-query";

import { PlanAuthor } from "@/app/feature/explore/_components/shared-plans/plan-author";
import { useAccountProfile, useViewer } from "@/hooks/use-social";
import { avatarUrl, getPlanAuthor } from "@/lib/social-api";
import { ProfileLink } from "./profile-link";
import { UserAvatar } from "./user-avatar";

type PlanAuthorLinkProps = {
  token: string | undefined;
  /** The byline frozen at publish time; null for an anonymous plan. */
  name: string | null | undefined;
  size?: "sm" | "default";
};

/**
 * "Shared by …" that links to the author's profile. The account is looked up
 * server-side from the plan link, and only for plans listed on Explore under
 * the owner's name, so an anonymous or link-only plan keeps its plain byline.
 * Guests, and any lookup that fails, see the original text.
 */
export function PlanAuthorLink({ token, name, size = "sm" }: PlanAuthorLinkProps) {
  const viewer = useViewer();
  const author = useQuery({
    queryKey: ["plan-author", token],
    queryFn: ({ signal }) => getPlanAuthor(token as string, signal),
    enabled: viewer.signedIn && !!token && !!name?.trim(),
    staleTime: 5 * 60_000,
    retry: false,
  });
  const profile = useAccountProfile(author.data?.accountId);

  if (!profile.data?.username) return <PlanAuthor name={name} size={size} />;
  const shown = name?.trim() || profile.data.displayName;
  return (
    <span className="flex min-w-0 items-center gap-2">
      <ProfileLink username={profile.data.username} label={`${shown}'s profile`} className="shrink-0 rounded-full hover:no-underline">
        <UserAvatar name={shown} src={avatarUrl(profile.data)} size={size} />
      </ProfileLink>
      <span className="min-w-0 truncate">
        Shared by <ProfileLink username={profile.data.username} className="font-medium text-foreground">{shown}</ProfileLink>
      </span>
    </span>
  );
}

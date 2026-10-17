"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { UserRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { currentUserProfileQueryKey, getMyProfile } from "@/lib/profile-api";
import { cn } from "@/lib/utils";

type ProfileMenuProps = { compact?: boolean; wrapName?: boolean; onNavigate?: () => void };

export function ProfileMenu({ compact = false, wrapName = false, onNavigate }: ProfileMenuProps) {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated" && !!session?.user && !session.error;
  const profile = useQuery({
    queryKey: currentUserProfileQueryKey(session?.user?.id),
    queryFn: getMyProfile,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  const name = profile.data?.displayName || session?.user?.name || "Traveller";
  const displayName = status === "loading" ? "Loading account…" : isAuthenticated ? name : "Sign in";
  const [firstName, ...remainingName] = displayName.trim().split(/\s+/);
  const picture = !isAuthenticated ? undefined : profile.data?.avatarMediaId
    ? `/api/users/me/picture?v=${profile.data.avatarMediaId}`
    : session?.user?.image;
  const initials = name.trim().split(/\s+/).map((word) => word[0]).slice(0, 2).join("").toUpperCase();

  return (
    <Link
      href={isAuthenticated ? "/settings/profile" : "/sign-in"}
      onClick={onNavigate}
      aria-label={isAuthenticated ? "Open profile" : "Sign in"}
      className={cn("flex h-auto min-w-0 items-center gap-2 rounded-md p-1 hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring", !compact && "flex-1 justify-start text-left")}
    >
        <Avatar size="lg">
          {picture && <AvatarImage src={picture} alt="" />}
          <AvatarFallback>{isAuthenticated ? initials : <UserRound className="size-4" />}</AvatarFallback>
        </Avatar>
        {!compact && <span className={cn("min-w-0", wrapName && "flex-1")}>
          <span title={displayName} className={cn("block text-xs font-semibold", wrapName ? "leading-snug" : "truncate")}>
            {wrapName && isAuthenticated && remainingName.length > 0 ? <>
              <span className="block truncate">{firstName}</span>
              <span className="block truncate">{remainingName.join(" ")}</span>
            </> : <span className="block truncate">{displayName}</span>}
          </span>
          <span className={cn("block truncate text-xs font-normal text-muted-foreground", wrapName && "leading-snug")}>{isAuthenticated ? "Travel enthusiast" : "Sign in to plan trips"}</span>
        </span>}
    </Link>
  );
}

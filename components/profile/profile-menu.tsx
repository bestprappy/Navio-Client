"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { UserRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { currentUserProfileQueryKey, getMyProfile } from "@/lib/profile-api";
import { cn } from "@/lib/utils";

type ProfileMenuProps = { compact?: boolean; onNavigate?: () => void };

export function ProfileMenu({ compact = false, onNavigate }: ProfileMenuProps) {
  const { data: session, status } = useSession();
  const profile = useQuery({
    queryKey: currentUserProfileQueryKey(session?.user?.id),
    queryFn: getMyProfile,
    enabled: status === "authenticated",
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  const name = profile.data?.displayName || session?.user?.name || "Traveller";
  const picture = profile.data?.avatarMediaId
    ? `/api/users/me/picture?v=${profile.data.avatarMediaId}`
    : session?.user?.image;
  const initials = name.trim().split(/\s+/).map((word) => word[0]).slice(0, 2).join("").toUpperCase();

  return (
    <Link
      href={status === "authenticated" ? "/settings/profile" : "/sign-in"}
      onClick={onNavigate}
      aria-label={status === "authenticated" ? "Open profile" : "Sign in"}
      className={cn("flex h-auto min-w-0 items-center gap-2 rounded-md p-1 hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring", !compact && "flex-1 justify-start text-left")}
    >
        <Avatar size="lg">
          {picture && <AvatarImage src={picture} alt="" />}
          <AvatarFallback>{status === "authenticated" ? initials : <UserRound className="size-4" />}</AvatarFallback>
        </Avatar>
        {!compact && <span className="min-w-0">
          <span className="block truncate text-xs font-semibold">{status === "loading" ? "Loading account…" : name}</span>
          <span className="block truncate text-xs font-normal text-muted-foreground">{status === "authenticated" ? "Travel enthusiast" : "Explore as a guest"}</span>
        </span>}
    </Link>
  );
}

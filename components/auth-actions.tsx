"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button.variants";
import { currentUserProfileQueryKey, getMyProfile } from "@/lib/profile-api";
import { cn } from "@/lib/utils";

type AuthActionsProps = {
  className?: string;
  compact?: boolean;
  mobile?: boolean;
  onNavigate?: () => void;
};

function getInitials(name?: string | null, email?: string | null) {
  const value = name?.trim() || email?.trim() || "User";
  const words = value.split(/\s+/).filter(Boolean);

  if (words.length > 1) {
    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
  }

  return value.slice(0, 2).toUpperCase();
}

export function AuthActions({
  className,
  compact = false,
  mobile = false,
  onNavigate,
}: AuthActionsProps) {
  const { data: session, status } = useSession();
  // Same key and fetcher as the profile settings page, so saving a new display
  // name there updates the name shown here without another request.
  const profileQuery = useQuery({
    queryKey: currentUserProfileQueryKey(session?.user?.id),
    queryFn: getMyProfile,
    enabled: status === "authenticated",
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  if (status === "loading") {
    return (
      <div
        className={cn(
          "h-8 w-20 animate-pulse rounded-lg bg-muted",
          mobile && "h-20 w-full",
          className,
        )}
        aria-label="Loading account"
      />
    );
  }

  if (status === "unauthenticated") {
    return (
      <div
        className={cn(
          "flex items-center gap-2",
          mobile && "flex-col items-stretch",
          className,
        )}
      >
        <Link
          href="/sign-in"
          className={cn(buttonVariants({ variant: "outline" }))}
          onClick={onNavigate}
        >
          Sign In
        </Link>
        {!compact || mobile ? (
          <Link
            href="/sign-up"
            className={cn(buttonVariants())}
            onClick={onNavigate}
          >
            Get Started
          </Link>
        ) : null}
      </div>
    );
  }

  const userLabel =
    profileQuery.data?.displayName ||
    session?.user?.name ||
    session?.user?.email ||
    "Account";

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        mobile && "flex-col items-stretch",
        className,
      )}
    >
      <Link
        href="/settings/profile"
        title="Profile settings"
        onClick={onNavigate}
        aria-label={`Open profile settings for ${userLabel}`}
        className={cn(
          "flex min-w-0 items-center gap-2 rounded-lg p-1 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          mobile && "rounded-lg border border-border p-3",
        )}
      >
        <Avatar aria-label={userLabel}>
          {session?.user?.image ? (
            <AvatarImage src={session.user.image} alt="" />
          ) : null}
          <AvatarFallback>
            {getInitials(session?.user?.name, session?.user?.email)}
          </AvatarFallback>
        </Avatar>
        {mobile ? (
          <span className="min-w-0 truncate text-sm font-medium">
            {userLabel}
          </span>
        ) : null}
      </Link>
      <Button
        type="button"
        variant={mobile ? "outline" : "ghost"}
        size={mobile ? "default" : "icon"}
        onClick={() => {
          onNavigate?.();
          void signOut({ redirectTo: "/" });
        }}
        aria-label="Sign out"
      >
        <LogOut aria-hidden="true" />
        {mobile ? "Sign Out" : null}
      </Button>
    </div>
  );
}

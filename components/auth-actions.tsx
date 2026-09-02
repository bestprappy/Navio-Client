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
import { cn } from "@/lib/utils";

type AuthActionsProps = {
  className?: string;
  compact?: boolean;
  mobile?: boolean;
  onNavigate?: () => void;
};

type CurrentUserProfile = {
  id: string;
  displayName: string;
  email: string;
};

function isCurrentUserProfile(value: unknown): value is CurrentUserProfile {
  if (!value || typeof value !== "object") return false;
  const profile = value as Record<string, unknown>;
  return (
    typeof profile.id === "string" &&
    typeof profile.displayName === "string" &&
    typeof profile.email === "string"
  );
}

async function getCurrentUserProfile(): Promise<CurrentUserProfile> {
  const response = await fetch("/api/users/me", {
    cache: "no-store",
    credentials: "same-origin",
  });
  const body: unknown = await response.json();

  if (!response.ok || !isCurrentUserProfile(body)) {
    throw new Error("The current user profile could not be loaded.");
  }

  return body;
}

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
  const profileQuery = useQuery({
    queryKey: ["current-user-profile", session?.user?.id],
    queryFn: getCurrentUserProfile,
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
      <div
        className={cn(
          "flex min-w-0 items-center gap-2",
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
      </div>
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

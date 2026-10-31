"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Ban, Check, Flag, Link2, MoreHorizontal, PencilLine, UserX } from "lucide-react";

import { BlockDialog } from "@/components/social/block-dialog";
import { FollowButton } from "@/components/social/follow-button";
import { ProfileHeader } from "@/components/social/profile-header";
import { ReportDialog } from "@/components/social/report-dialog";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button.variants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useSocialSummary, useViewer } from "@/hooks/use-social";
import { ApiError } from "@/lib/api-client";
import { avatarUrl, bannerUrl, getProfileByUsername, profilePath, socialKeys } from "@/lib/social-api";
import { cn } from "@/lib/utils";
import type { PublicProfile, SocialSummary } from "@/lib/validations/social";
import { ConnectionsDialog } from "./connections-dialog";
import { ProfileContentTabs } from "./profile-content-tabs";

function formatCount(value: number) {
  return new Intl.NumberFormat(undefined, { notation: value >= 10_000 ? "compact" : "standard" }).format(value);
}

/** A traveller's public profile at /u/{username}. */
export function PublicProfilePage({ username }: { username: string }) {
  const router = useRouter();
  const viewer = useViewer();
  const profile = useQuery({
    queryKey: socialKeys.profileByUsername(username),
    queryFn: ({ signal }) => getProfileByUsername(username, signal),
    enabled: viewer.signedIn,
    retry: (count, error) => !(error instanceof ApiError && [404, 410].includes(error.status)) && count < 1,
  });

  // A handle the owner has since changed still resolves; move the address bar to the current one.
  const current = profile.data?.username;
  useEffect(() => {
    if (current && current !== username.toLowerCase()) router.replace(profilePath(current));
  }, [current, username, router]);

  if (!viewer.loading && !viewer.signedIn) {
    return (
      <ProfileUnavailable icon={Ban} title="Sign in to see this profile" body="Profiles are visible to signed-in Navio travellers."
        action={<Link href={`/sign-in?callbackUrl=${encodeURIComponent(profilePath(username))}`} className={cn(buttonVariants(), "h-10 px-5")}>Sign in</Link>} />
    );
  }
  if (viewer.loading || profile.isPending) return <ProfileSkeleton />;
  if (profile.error instanceof ApiError && profile.error.status === 410) {
    return <ProfileUnavailable icon={UserX} title="This account was deleted" body="The traveller closed their Navio account, so their profile, posts and shared plans are no longer available." />;
  }
  if (profile.error instanceof ApiError && profile.error.status === 404) {
    return <ProfileUnavailable icon={UserX} title={`No one goes by @${username}`} body="Check the spelling, or the traveller may have changed their username more than 90 days ago." />;
  }
  if (!profile.data) {
    return (
      <ProfileUnavailable icon={Ban} title="This profile couldn't load" body={profile.error?.message ?? "Try again in a moment."}
        action={<Button type="button" variant="outline" className="h-10 px-5" disabled={profile.isFetching} onClick={() => void profile.refetch()}>Try again</Button>} />
    );
  }
  return <LoadedProfile profile={profile.data} />;
}

function LoadedProfile({ profile }: { profile: PublicProfile }) {
  const viewer = useViewer();
  const accountId = profile.accountId;
  const summary = useSocialSummary(accountId);
  const [connections, setConnections] = useState<"followers" | "following" | null>(null);
  const isOwner = !!accountId && viewer.accountId === accountId;
  const data = summary.data;
  const blockedViewer = data?.blockedViewer ?? false;
  const viewerBlocked = data?.viewerBlocked ?? false;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <ProfileHeader
        profile={{
          displayName: profile.displayName,
          username: profile.username,
          bio: profile.bio,
          avatarUrl: avatarUrl(profile),
          bannerUrl: bannerUrl(profile),
          travelInterests: profile.travelInterests,
          travelPace: profile.travelPace,
          memberSince: profile.memberSince,
        }}
        actions={isOwner ? (
          <Link href="/settings/profile" className={cn(buttonVariants({ variant: "outline" }), "h-10 px-4")}>
            <PencilLine aria-hidden="true" />
            Edit profile
          </Link>
        ) : accountId && data ? (
          <>
            <FollowButton accountId={accountId} name={profile.displayName} summary={data} />
            <ProfileMenu profile={profile} accountId={accountId} summary={data} />
          </>
        ) : summary.isPending && accountId ? <Skeleton className="h-10 w-36" /> : null}
        stats={data ? (
          <>
            <StatButton count={data.followerCount} label={data.followerCount === 1 ? "follower" : "followers"}
              enabled={data.canViewConnections && !blockedViewer} onOpen={() => setConnections("followers")} />
            <StatButton count={data.followingCount} label="following"
              enabled={data.canViewConnections && !blockedViewer} onOpen={() => setConnections("following")} />
            {!data.canViewConnections ? <span>Lists are private</span> : null}
            {data.followsViewer && !isOwner ? <span className="rounded-full bg-muted px-2 py-0.5 text-xs">Follows you</span> : null}
          </>
        ) : null}
        notice={blockedViewer ? (
          <p className="mt-4 text-sm text-muted-foreground">You can&apos;t see this traveller&apos;s posts or plans.</p>
        ) : viewerBlocked ? (
          <p className="mt-4 text-sm text-muted-foreground">You blocked @{profile.username}. Unblock them from the menu to see their posts and plans.</p>
        ) : undefined}
      />

      {accountId && data && !blockedViewer && !viewerBlocked ? (
        <ProfileContentTabs accountId={accountId} name={profile.displayName} isOwner={isOwner} />
      ) : null}
      {summary.isError ? (
        <p role="alert" className="mt-6 text-sm text-muted-foreground">
          Followers and posts couldn&apos;t load. <button type="button" className="font-medium text-primary underline underline-offset-4" onClick={() => void summary.refetch()}>Try again</button>
        </p>
      ) : null}

      {accountId ? <ConnectionsDialog accountId={accountId} name={profile.displayName} kind={connections} onKindChange={setConnections} /> : null}
    </main>
  );
}

function StatButton({ count, label, enabled, onOpen }: { count: number; label: string; enabled: boolean; onOpen: () => void }) {
  const content = <><span className="font-semibold text-foreground tabular-nums">{formatCount(count)}</span> {label}</>;
  if (!enabled) return <span>{content}</span>;
  return (
    <button type="button" onClick={onOpen} className="rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
      {content}
    </button>
  );
}

function ProfileMenu({ profile, accountId, summary }: { profile: PublicProfile; accountId: string; summary: SocialSummary }) {
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    if (!profile.username) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${profilePath(profile.username)}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch (error) {
      console.warn("Profile link could not be copied.", { component: "ProfileMenu", error });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button type="button" variant="outline" size="icon" className="size-10" aria-label={`More options for ${profile.displayName}`} />}>
          <MoreHorizontal aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          <DropdownMenuItem onClick={() => void copyLink()}>
            {copied ? <Check aria-hidden="true" /> : <Link2 aria-hidden="true" />}
            {copied ? "Link copied" : "Copy profile link"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setReportOpen(true)}>
            <Flag aria-hidden="true" />
            Report profile
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setBlockOpen(true)}>
            <Ban aria-hidden="true" />
            {summary.viewerBlocked ? "Unblock" : "Block"} @{profile.username}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <span role="status" className="sr-only">{copied ? "Profile link copied" : ""}</span>
      <ReportDialog open={reportOpen} onOpenChange={setReportOpen} targetType="user" targetId={accountId} subject={profile.displayName} />
      <BlockDialog open={blockOpen} onOpenChange={setBlockOpen} accountId={accountId} name={profile.displayName} unblock={summary.viewerBlocked} />
    </>
  );
}

function ProfileSkeleton() {
  return (
    <main aria-busy="true" aria-label="Loading profile" className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="overflow-hidden rounded-[var(--card-radius-lg)] border border-border bg-card">
        <Skeleton className="aspect-[3/1] max-h-64 w-full rounded-none" />
        <div className="px-5 pb-6 sm:px-8">
          <Skeleton className="-mt-12 size-24 rounded-[var(--card-radius-md)] sm:-mt-16 sm:size-32" />
          <Skeleton className="mt-4 h-8 w-56" />
          <Skeleton className="mt-2 h-4 w-32" />
          <Skeleton className="mt-5 h-4 w-full max-w-md" />
        </div>
      </div>
    </main>
  );
}

function ProfileUnavailable({ icon: Icon, title, body, action }: { icon: typeof UserX; title: string; body: string; action?: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col items-start gap-3 px-4 py-16 sm:px-6">
      <Icon aria-hidden="true" className="size-8 text-muted-foreground" />
      <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
      <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {action}
        <Link href="/community" className={cn(buttonVariants({ variant: "ghost" }), "h-10 px-4")}>Go to Community</Link>
      </div>
    </main>
  );
}

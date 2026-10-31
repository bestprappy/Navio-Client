"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Check, Copy, ExternalLink, LogOut, Mail } from "lucide-react";

import { MachineReadableZone } from "@/components/profile/machine-readable-zone";
import { PassportPhoto } from "@/components/social/user-avatar";
import { Button } from "@/components/ui/button";
import { useMyProfile } from "@/hooks/use-my-profile";
import { profilePath } from "@/lib/social-api";
import { SettingsGroup, SettingsHeader, VisibilityBadge } from "../settings-section";
import { SESSION_EXPIRED, SettingsLoadError, SettingsSkeleton } from "../settings-states";

function formatDate(value: string | null): string {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleDateString(undefined, { dateStyle: "long" });
}

/** Settings > Account: the account itself, not what others see. */
export function AccountSection({ emailChangeUrl }: { emailChangeUrl: string | null }) {
  const profile = useMyProfile();
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  if (profile.sessionExpired) return <SettingsLoadError title="Account" error={SESSION_EXPIRED} retrying={false} onRetry={() => undefined} />;
  if (profile.isPending) return <SettingsSkeleton title="Account" />;
  if (!profile.data) {
    return <SettingsLoadError title="Account" error={profile.error} retrying={profile.isFetching} onRetry={() => void profile.refetch()} />;
  }
  const data = profile.data;
  const link = data.username ? `${typeof window === "undefined" ? "" : window.location.origin}${profilePath(data.username)}` : null;

  const copyLink = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setCopyFailed(false);
      window.setTimeout(() => setCopied(false), 2500);
    } catch (error) {
      setCopyFailed(true);
      console.warn("Profile link could not be copied.", { component: "AccountSection", error });
    }
  };

  return (
    <main className="flex flex-col">
      <SettingsHeader title="Account" description="Your Navio account and how it is identified. Only you see this page." />

      <section aria-label="Account details" className="mt-6 overflow-hidden rounded-[var(--card-radius-lg)] border border-border bg-card shadow-xs">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
          <PassportPhoto
            name={data.displayName}
            src={data.avatarMediaId ? `/api/users/me/picture?v=${data.avatarMediaId}` : null}
            className="size-20 shrink-0 ring-1 ring-border sm:size-24"
          />
          <dl className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <dt className="text-xs font-medium text-muted-foreground">Name</dt>
              <dd className="mt-1 truncate text-sm font-semibold">{data.displayName}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs font-medium text-muted-foreground">Username</dt>
              <dd className="mt-1 truncate text-sm">{data.username ? `@${data.username}` : "Assigned on your next sign-in"}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs font-medium text-muted-foreground">Email</dt>
              <dd className="mt-1 truncate text-sm" title={data.email}>{data.email}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs font-medium text-muted-foreground">Member since</dt>
              <dd className="mt-1 text-sm">{formatDate(data.createdAt)}</dd>
            </div>
          </dl>
        </div>
        <MachineReadableZone displayName={data.displayName} userId={data.id} memberSince={data.createdAt} />
      </section>

      <div className="divide-y divide-border">
        <SettingsGroup title="Email address" aside={<VisibilityBadge visibility="private" />}
          description="Used to sign in and for account messages. Never shown on your profile.">
          <div className="flex flex-col gap-3">
            <p className="flex items-center gap-2 text-sm"><Mail aria-hidden="true" className="size-4 text-muted-foreground" />{data.email}</p>
            {emailChangeUrl ? (
              <a href={emailChangeUrl} className="inline-flex w-fit min-h-10 items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline">
                Change email
                <ExternalLink aria-hidden="true" className="size-3.5" />
              </a>
            ) : null}
            <p className="text-xs leading-relaxed text-muted-foreground">
              Email changes happen in your Navio sign-in account, which asks you to confirm it&apos;s you and verifies the new
              address when verification is turned on. Navio picks up the new address the next time you sign in.
            </p>
          </div>
        </SettingsGroup>

        <SettingsGroup title="Profile link" aside={<VisibilityBadge visibility="public" />}
          description="Share this to send people to your public profile.">
          {link ? (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <code className="max-w-full truncate rounded-md bg-well px-3 py-2 text-sm">{link}</code>
                <Button type="button" variant="outline" className="h-10 px-4" onClick={() => void copyLink()}>
                  {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                  {copied ? "Copied" : "Copy link"}
                </Button>
              </div>
              <span role="status" className="text-xs text-muted-foreground">
                {copyFailed ? "Copying isn't allowed here. Select the link and copy it instead." : ""}
              </span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Your link appears once your username is assigned.</p>
          )}
        </SettingsGroup>

        <SettingsGroup title="Sign out" description="Ends your session on this device. To sign out everywhere, use Security.">
          <Button type="button" variant="outline" className="h-10 px-4" onClick={() => void signOut({ redirectTo: "/" })}>
            <LogOut aria-hidden="true" />
            Sign out
          </Button>
        </SettingsGroup>
      </div>
    </main>
  );
}

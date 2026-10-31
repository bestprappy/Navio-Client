"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { ProfilePhoto } from "@/components/profile/profile-photo";
import { buttonVariants } from "@/components/ui/button.variants";
import { useMyProfile } from "@/hooks/use-my-profile";
import { profilePath } from "@/lib/social-api";
import { cn } from "@/lib/utils";
import { SettingsGroup, SettingsHeader, VisibilityBadge } from "../settings-section";
import { SESSION_EXPIRED, SettingsLoadError, SettingsSkeleton } from "../settings-states";
import { BannerEditor } from "./banner-editor";
import { PublicProfileForm } from "./public-profile-form";

/** Settings > Profile: everything other travellers can see about you. */
export function ProfileSection() {
  const profile = useMyProfile();

  if (profile.sessionExpired) return <SettingsLoadError title="Profile" error={SESSION_EXPIRED} retrying={false} onRetry={() => undefined} />;
  if (profile.isPending) return <SettingsSkeleton title="Profile" />;
  if (!profile.data) {
    return <SettingsLoadError title="Profile" error={profile.error} retrying={profile.isFetching} onRetry={() => void profile.refetch()} />;
  }

  const data = profile.data;
  return (
    <main className="flex flex-col">
      <SettingsHeader
        title="Profile"
        description="Everything on this page is public to signed-in travellers. Your email and account details are not."
        action={data.username ? (
          <Link href={profilePath(data.username)} className={cn(buttonVariants({ variant: "outline" }), "h-10 px-4")}>
            <ExternalLink aria-hidden="true" />
            View public profile
          </Link>
        ) : null}
      />
      <div className="divide-y divide-border">
        <SettingsGroup title="Banner" aside={<VisibilityBadge visibility="public" />}
          description="The wide image across the top of your profile.">
          <BannerEditor profile={data} onSaved={profile.replace} />
        </SettingsGroup>
        <SettingsGroup title="Profile photo" aside={<VisibilityBadge visibility="public" />}
          description="Shown next to your name everywhere in Navio.">
          <ProfilePhoto profile={data} fallbackImageUrl={null} onSaved={(updated) => void profile.replace(updated)} />
        </SettingsGroup>
        <PublicProfileForm key={data.id} profile={data} onSaved={profile.replace} />
      </div>
    </main>
  );
}

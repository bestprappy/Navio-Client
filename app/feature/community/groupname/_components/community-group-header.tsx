"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, BellOff, Camera, Plus, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { type GroupDetail, toCommunityGroup } from "../../_components/community-api";
import { useGroupMembership } from "../../_components/community-group-queries";
import { CommunityBanner, CommunityIcon, communityHandle } from "../../_components/community-identity";
import { CommunityMembershipButton } from "../../_components/community-membership-button";
import { CommunityQueryError } from "../../_components/community-query-state";
import { formatCount } from "../../_components/data";
import { CommunitySettingsDialog, type CommunitySettingsSection } from "./community-settings-dialog";

export function CommunityGroupHeader({ detail }: { detail: GroupDetail }) {
  const group = toCommunityGroup(detail);
  const mutation = useGroupMembership();
  const { requireAuth } = useRequireAuth();
  const [settings, setSettings] = useState<CommunitySettingsSection | null>(null);
  const canManage = Boolean(group.joined) && (group.role === "moderator" || group.role === "admin");
  const archived = group.status === "archived";
  const seed = detail.slug;

  return (
    <section aria-labelledby="community-title" className="flex flex-col">
      <div className="relative">
        <CommunityBanner
          seed={seed}
          src={group.bannerUrl}
          alt={`${group.name} banner`}
          className="h-28 rounded-2xl sm:h-40"
        />
        {canManage ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setSettings("appearance")}
            className="absolute bottom-3 right-3 rounded-full bg-card/90 shadow-sm backdrop-blur"
          >
            <Camera aria-hidden="true" />
            Edit pictures
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-end gap-x-4 gap-y-3 px-2 sm:px-4">
        <div className="relative -mt-10 sm:-mt-12">
          <CommunityIcon name={group.name} seed={seed} src={group.avatarUrl} size="xl" />
          {canManage ? (
            <button
              type="button"
              onClick={() => setSettings("appearance")}
              aria-label="Change community icon"
              className="absolute bottom-0.5 right-0.5 flex size-8 items-center justify-center rounded-full bg-card text-foreground shadow-md ring-1 ring-border transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Camera className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div className="min-w-0 flex-1 pb-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 id="community-title" className="break-words text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {group.name}
            </h1>
            {group.isOfficial ? <Badge className="bg-primary/12 text-primary">Official</Badge> : null}
            {archived ? <Badge variant="outline">Archived</Badge> : null}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground/80">{communityHandle(detail.slug, group.name)}</span>
            <span aria-hidden="true"> · </span>
            {formatCount(group.memberCount)} {group.memberCount === 1 ? "member" : "members"}
            <span aria-hidden="true"> · </span>
            {formatCount(group.postCount)} {group.postCount === 1 ? "post" : "posts"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 pb-1">
          {!archived ? (
            <Button
              variant="outline"
              nativeButton={false}
              className="h-9 rounded-full px-4 font-semibold"
              render={<Link href={`/community/create?groupId=${group.id}&groupSlug=${encodeURIComponent(detail.slug)}`} />}
            >
              <Plus aria-hidden="true" />
              Create post
            </Button>
          ) : null}
          <CommunityMembershipButton group={group} className="[&_button]:h-9" />
          {group.joined ? (
            <Button
              variant="outline"
              size="icon"
              className="size-9 rounded-full"
              disabled={mutation.isPending}
              aria-pressed={Boolean(group.muted)}
              aria-label={group.muted ? "Unmute community" : "Mute community"}
              title={group.muted ? "Muted: hidden from your feeds" : "Mute: hide from your feeds"}
              onClick={() => requireAuth(() => mutation.mutate({ group, action: group.muted ? "unmute" : "mute" }))}
            >
              {group.muted ? <BellOff aria-hidden="true" /> : <Bell aria-hidden="true" />}
            </Button>
          ) : null}
          {canManage ? (
            <Button
              variant="outline"
              size="icon"
              className="size-9 rounded-full"
              aria-label="Manage community"
              title="Manage community"
              onClick={() => setSettings("profile")}
            >
              <Settings aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      </div>
      <CommunityQueryError error={mutation.error} />
      {canManage ? (
        <CommunitySettingsDialog
          group={detail}
          section={settings}
          onSectionChange={setSettings}
        />
      ) : null}
    </section>
  );
}

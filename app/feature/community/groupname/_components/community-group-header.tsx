"use client";

import Link from "next/link";
import Image from "next/image";
import { Bell, BellOff, Plus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/hooks/use-require-auth";
import {
  type GroupDetail,
  toCommunityGroup,
} from "../../_components/community-api";
import { useGroupMembership } from "../../_components/community-group-queries";
import { CommunityMembershipButton } from "../../_components/community-membership-button";
import { CommunityQueryError } from "../../_components/community-query-state";
import { formatCount, getInitials } from "../../_components/data";
import { CommunitySettingsDialog } from "./community-settings-dialog";

export function CommunityGroupHeader({ detail }: { detail: GroupDetail }) {
  const group = toCommunityGroup(detail);
  const mutation = useGroupMembership();
  const { requireAuth } = useRequireAuth();
  return (
    <section className="space-y-4 overflow-hidden rounded-lg bg-card">
      <div className="relative h-32 bg-secondary sm:h-44">
        {group.profile?.bannerUrl ? (
          <Image
            src={group.profile.bannerUrl}
            alt={`${group.name} banner`}
            fill
            unoptimized
            sizes="100vw"
            className="object-cover"
          />
        ) : null}
      </div>
      <div className="space-y-4 px-4 pb-4 sm:px-6">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-16 shrink-0">
              <AvatarFallback className="text-xl font-bold">
                {getInitials(group.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="break-words text-2xl font-extrabold sm:text-3xl">
                {group.name}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatCount(group.memberCount)} members ·{" "}
                {formatCount(group.postCount)} posts
              </p>
            </div>
          </div>
          {group.isOfficial ? (
            <Badge variant="secondary">Official</Badge>
          ) : null}
        </div>
        <div className="flex flex-wrap items-start gap-2">
          <Button
            nativeButton={false}
            render={
              <Link
                href={`/community/create?groupId=${group.id}&groupSlug=${encodeURIComponent(detail.slug)}`}
              />
            }
          >
            <Plus className="size-4" aria-hidden="true" />
            Create post
          </Button>
          <CommunityMembershipButton group={group} />
          {group.joined ? (
            <Button
              variant="outline"
              disabled={mutation.isPending}
              aria-pressed={Boolean(group.muted)}
              aria-label={group.muted ? "Unmute community" : "Mute community"}
              onClick={() =>
                requireAuth(() =>
                  mutation.mutate({
                    group,
                    action: group.muted ? "unmute" : "mute",
                  }),
                )
              }
            >
              {group.muted ? (
                <BellOff className="size-4" aria-hidden="true" />
              ) : (
                <Bell className="size-4" aria-hidden="true" />
              )}
              {group.muted ? "Muted" : "Mute"}
            </Button>
          ) : null}
          <CommunitySettingsDialog group={detail} />
        </div>
        <CommunityQueryError error={mutation.error} />
      </div>
    </section>
  );
}

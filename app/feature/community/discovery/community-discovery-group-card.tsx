"use client";

import Link from "next/link";
import { Check, MapPin, UserPlus, Users } from "lucide-react";

import type { CommunityGroup } from "../_components/data";
import {
  formatCount,
  getInitials,
  slugifyCommunityValue,
} from "../_components/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type CommunityDiscoveryGroupCardProps = {
  group: CommunityGroup;
  joined: boolean;
  weeklyVisitorCount: number;
  onToggleJoin: (groupId: string) => void;
};

function formatVisitorCount(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(".0", "")}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(".0", "")}K`;
  }

  return value.toString();
}

export function CommunityDiscoveryGroupCard({
  group,
  joined,
  weeklyVisitorCount,
  onToggleJoin,
}: CommunityDiscoveryGroupCardProps) {
  const groupHref = `/community/${slugifyCommunityValue(group.name)}`;

  return (
    <Card
      size="sm"
      className="min-h-28 rounded-lg transition-colors hover:bg-muted/40"
    >
      <CardContent className="flex h-full flex-col gap-3 p-3">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <Link
            href={groupHref}
            className="flex min-w-0 flex-1 items-start gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <Avatar className="size-10 shrink-0">
              <AvatarImage src={group.avatarUrl} alt={group.name} />
              <AvatarFallback className="text-xs font-semibold">
                {getInitials(group.name)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h2 className="truncate text-sm font-extrabold leading-tight text-foreground">
                  {group.name}
                </h2>
                {group.isOfficial ? (
                  <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                    Official
                  </Badge>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatVisitorCount(weeklyVisitorCount)} weekly visitors
              </p>
            </div>
          </Link>

          <Button
            type="button"
            size="sm"
            variant={joined ? "secondary" : "outline"}
            aria-pressed={joined}
            aria-label={`${joined ? "Leave" : "Join"} ${group.name}`}
            className="h-8 shrink-0 rounded-full px-3"
            onClick={() => onToggleJoin(group.id)}
          >
            {joined ? (
              <Check className="size-3.5" aria-hidden="true" />
            ) : (
              <UserPlus className="size-3.5" aria-hidden="true" />
            )}
            {joined ? "Joined" : "Join"}
          </Button>
        </div>

        <Link
          href={groupHref}
          className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <p className="line-clamp-2 min-h-10 text-xs leading-relaxed text-muted-foreground">
            {group.description}
          </p>
        </Link>

        <div className="mt-auto flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="size-3" aria-hidden="true" />
            {formatCount(group.memberCount)} members
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="size-3" aria-hidden="true" />
            {group.country}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

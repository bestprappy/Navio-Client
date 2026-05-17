"use client";

import Link from "next/link";
import { Check, MapPin, UserPlus, Users } from "lucide-react";

import type { CommunityGroup } from "./data";
import { formatCount, getInitials, slugifyCommunityValue } from "./data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type CommunityGroupCardProps = {
  group: CommunityGroup;
  joined: boolean;
  onToggleJoin: (groupId: string) => void;
};

export function CommunityGroupCard({
  group,
  joined,
  onToggleJoin,
}: CommunityGroupCardProps) {
  const groupHref = `/community/${slugifyCommunityValue(group.name)}`;

  return (
    <Card size="sm">
      <CardHeader>
        <Link
          href={groupHref}
          className="flex min-w-0 items-start gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <Avatar>
            <AvatarImage src={group.avatarUrl} alt={group.name} />
            <AvatarFallback>{getInitials(group.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <CardTitle className="line-clamp-1">{group.name}</CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {group.description}
            </CardDescription>
          </div>
        </Link>
        <CardAction>
          <Button
            type="button"
            size="sm"
            variant={joined ? "secondary" : "outline"}
            aria-pressed={joined}
            onClick={() => onToggleJoin(group.id)}
          >
            {joined ? <Check aria-hidden="true" /> : <UserPlus aria-hidden="true" />}
            {joined ? "Joined" : "Join"}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="size-3.5" aria-hidden="true" />
            {formatCount(group.memberCount)} members
          </span>
          <span>{formatCount(group.postCount)} posts</span>
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" aria-hidden="true" />
            {group.country}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {group.tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant={group.isOfficial ? "secondary" : "outline"}>
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

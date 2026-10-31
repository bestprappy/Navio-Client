"use client";

import { Bell, BellOff, Check, LoaderCircle, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useRelationshipActions } from "@/hooks/use-social";
import { cn } from "@/lib/utils";
import type { SocialSummary } from "@/lib/validations/social";

type FollowButtonProps = {
  accountId: string;
  name: string;
  summary: SocialSummary;
  size?: "sm" | "default";
  /** Show the alerts bell next to "Following". */
  withAlerts?: boolean;
  className?: string;
};

/**
 * Follow / Following with an optional alerts bell. Following does not imply
 * alerts for every update: the bell turns post and plan notifications from this
 * person on or off independently. Hidden for yourself and when either side has
 * blocked the other.
 */
export function FollowButton({ accountId, name, summary, size = "default", withAlerts = true, className }: FollowButtonProps) {
  const { follow, alerts } = useRelationshipActions(accountId);
  if (summary.self || summary.viewerBlocked || summary.blockedViewer) return null;

  const following = summary.viewerFollows;
  const height = size === "sm" ? "h-9" : "h-10";

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Button
        type="button"
        variant={following ? "outline" : "default"}
        className={cn(height, "min-w-28 px-4")}
        disabled={follow.isPending}
        aria-label={following ? `Unfollow ${name}` : `Follow ${name}`}
        onClick={() => follow.mutate(!following)}
      >
        {follow.isPending ? (
          <LoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
        ) : following ? (
          <Check aria-hidden="true" />
        ) : (
          <UserPlus aria-hidden="true" />
        )}
        {following ? "Following" : summary.followsViewer ? "Follow back" : "Follow"}
      </Button>
      {following && withAlerts ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(height, size === "sm" ? "w-9" : "w-10")}
          aria-pressed={summary.viewerNotify}
          aria-label={summary.viewerNotify ? `Turn off alerts for ${name}` : `Get alerts when ${name} posts or shares a plan`}
          title={summary.viewerNotify ? "Alerts on for new posts and plans" : "Alerts off"}
          disabled={alerts.isPending}
          onClick={() => alerts.mutate(!summary.viewerNotify)}
        >
          {summary.viewerNotify ? <Bell aria-hidden="true" className="text-primary" /> : <BellOff aria-hidden="true" />}
        </Button>
      ) : null}
      {follow.isError || alerts.isError ? (
        <span role="alert" className="sr-only">
          {(follow.error ?? alerts.error)?.message}
        </span>
      ) : null}
    </div>
  );
}

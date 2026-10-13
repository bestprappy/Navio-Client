"use client";

import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { cn } from "@/lib/utils";
import { useGroupMembership } from "./community-group-queries";
import type { CommunityGroup } from "./data";

export function CommunityMembershipButton({
  group,
  compact = false,
  className,
}: {
  group: CommunityGroup;
  /** Small pill for feed rows and lists. */
  compact?: boolean;
  className?: string;
}) {
  const mutation = useGroupMembership();
  const { requireAuth, isAuthenticationLoading } = useRequireAuth();
  const joined = Boolean(group.joined);
  return (
    <div className={cn("flex max-w-full flex-col items-end gap-1", className)}>
      <Button
        type="button"
        size={compact ? "xs" : "sm"}
        variant={joined ? "outline" : "default"}
        disabled={mutation.isPending || isAuthenticationLoading}
        aria-pressed={joined}
        aria-label={`${joined ? "Leave" : "Join"} ${group.name}`}
        onClick={() =>
          requireAuth(() =>
            mutation.mutate({ group, action: joined ? "leave" : "join" }),
          )
        }
        className={cn("rounded-full font-bold", compact ? "px-3" : "px-4")}
      >
        {mutation.isPending ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : joined ? (
          <Check aria-hidden="true" />
        ) : null}
        {joined ? "Joined" : "Join"}
      </Button>
      {mutation.error ? (
        <p role="alert" className="max-w-56 text-right text-xs text-destructive">
          {mutation.error.message}
        </p>
      ) : null}
    </div>
  );
}

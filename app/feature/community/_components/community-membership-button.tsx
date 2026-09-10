"use client";

import { Check, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useGroupMembership } from "./community-group-queries";
import type { CommunityGroup } from "./data";

export function CommunityMembershipButton({
  group,
}: {
  group: CommunityGroup;
}) {
  const mutation = useGroupMembership();
  const { requireAuth, isAuthenticationLoading } = useRequireAuth();
  return (
    <div className="flex max-w-full flex-col items-end gap-2">
      <Button
        type="button"
        size="sm"
        variant={group.joined ? "secondary" : "outline"}
        disabled={mutation.isPending || isAuthenticationLoading}
        aria-pressed={Boolean(group.joined)}
        aria-label={`${group.joined ? "Leave" : "Join"} ${group.name}`}
        onClick={() =>
          requireAuth(() =>
            mutation.mutate({ group, action: group.joined ? "leave" : "join" }),
          )
        }
      >
        {mutation.isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : group.joined ? (
          <Check className="size-4" aria-hidden="true" />
        ) : (
          <UserPlus className="size-4" aria-hidden="true" />
        )}
        {group.joined ? "Joined" : "Join"}
      </Button>
      {mutation.error ? (
        <p role="alert" className="max-w-56 text-xs text-destructive">
          {mutation.error.message}
        </p>
      ) : null}
    </div>
  );
}

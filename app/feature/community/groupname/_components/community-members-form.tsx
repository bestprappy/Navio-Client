"use client";

import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { CommunityUserLabel } from "../../_components/community-user-label";
import {
  communityRequest,
  memberSchema,
  pageSchema,
  type GroupDetail,
} from "../../_components/community-api";
import {
  useCommunityIdentity,
  useUpdateCommunityGroup,
} from "../../_components/community-group-queries";
import {
  CommunityGroupLoading,
  CommunityQueryError,
} from "../../_components/community-query-state";

export function CommunityMembersForm({ group }: { group: GroupDetail }) {
  const { identity } = useCommunityIdentity();
  const [moderatorIds, setModeratorIds] = useState(group.moderatorIds);
  const mutation = useUpdateCommunityGroup(group.slug);
  const members = useInfiniteQuery({
    queryKey: ["community", identity, "members", group.slug],
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      communityRequest(
        `/${encodeURIComponent(group.slug)}/members?page=${pageParam}&size=20`,
        pageSchema(memberSchema),
        undefined,
        signal,
      ),
    getNextPageParam: (page) => (page.last ? undefined : page.number + 1),
  });
  const dirty =
    [...moderatorIds].sort().join() !== [...group.moderatorIds].sort().join();
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Choose moderators from current members. Keep at least one moderator.
      </p>
      {members.isLoading ? <CommunityGroupLoading /> : null}
      <CommunityQueryError
        error={members.error}
        onRetry={() => void members.refetch()}
      />
      {members.data?.pages
        .flatMap((page) => page.content)
        .map((member) => (
          <Field
            key={member.userId}
            orientation="horizontal"
            className="rounded-lg border border-border p-3"
          >
            <Checkbox
              id={`moderator-${member.userId}`}
              checked={moderatorIds.includes(member.userId)}
              disabled={mutation.isPending}
              onCheckedChange={(checked) =>
                setModeratorIds((previous) =>
                  checked
                    ? [...new Set([...previous, member.userId])]
                    : previous.filter((id) => id !== member.userId),
                )
              }
            />
            <FieldLabel
              htmlFor={`moderator-${member.userId}`}
              className="min-w-0 flex-1 break-all text-xs"
            >
              <CommunityUserLabel userId={member.userId} />
            </FieldLabel>
            <Badge variant="outline">{member.role}</Badge>
          </Field>
        ))}
      {members.hasNextPage ? (
        <Button
          variant="outline"
          disabled={members.isFetchingNextPage}
          onClick={() => void members.fetchNextPage()}
        >
          Load more members
        </Button>
      ) : null}
      <CommunityQueryError error={mutation.error} />
      {mutation.isSuccess && !dirty ? (
        <p role="status" className="text-sm text-success">
          Moderators saved.
        </p>
      ) : null}
      {moderatorIds.length === 0 ? (
        <p role="alert" className="text-sm text-destructive">
          Choose at least one moderator.
        </p>
      ) : null}
      <Button
        disabled={mutation.isPending || !dirty || moderatorIds.length === 0}
        onClick={() =>
          mutation.mutate({
            section: "moderators",
            body: { userIds: moderatorIds },
          })
        }
      >
        {mutation.isPending ? "Saving…" : "Save moderators"}
      </Button>
    </div>
  );
}

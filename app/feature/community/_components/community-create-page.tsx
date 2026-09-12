"use client";

import { useMemo } from "react";
import { useAtomValue } from "jotai";

import { createPostDraftAtom } from "./community-atoms";

import { CommunityErrorBoundary } from "./community-error-boundary";

import {
  useCommunityGroups,
  useCommunityGroup,
} from "./community-group-queries";
import { toCommunityGroup } from "./community-api";
import {
  CommunityGroupLoading,
  CommunityQueryError,
} from "./community-query-state";
import { CommunityGroupDialog } from "../create/community-group-dialog";
import { Button } from "@/components/ui/button";
import { CommunityComposer } from "../create/community-composer";
import { CommunityRulesSidebar } from "../create/community-rules-sidebar";

type CommunityCreatePageProps = {
  initialGroupId?: string | null;
  initialGroupSlug?: string | null;
  initialPlanId?: string | null;
};

export function CommunityCreatePage({
  initialGroupId = null,
  initialGroupSlug = null,
  initialPlanId = null,
}: CommunityCreatePageProps) {
  const groupsQuery = useCommunityGroups();
  const postDraft = useAtomValue(createPostDraftAtom);
  const selected = groupsQuery.data.find(
    (group) => group.id === postDraft.groupId,
  );
  const detail = useCommunityGroup(
    selected?.slug ?? initialGroupSlug ?? undefined,
  );
  const groups = useMemo(() => {
    const all = new Map(groupsQuery.data.map((group) => [group.id, group]));
    if (detail.data) all.set(detail.data.id, toCommunityGroup(detail.data));
    return [...all.values()];
  }, [groupsQuery.data, detail.data]);
  const selectedGroup = groups.find((group) => group.id === postDraft.groupId);

  return (
    <CommunityErrorBoundary>
      <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Create post
          </h1>
          <CommunityGroupDialog />
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          Share a question, trip note, or picture with your community.
        </p>
        {groupsQuery.isLoading ? <CommunityGroupLoading /> : null}
        <CommunityQueryError
          error={groupsQuery.error ?? detail.error}
          onRetry={() => {
            void groupsQuery.refetch();
            if (detail.error) void detail.refetch();
          }}
        />
        {groupsQuery.hasNextPage ? (
          <Button
            variant="outline"
            className="mb-4"
            disabled={groupsQuery.isFetchingNextPage}
            onClick={() => void groupsQuery.fetchNextPage()}
          >
            Load more communities
          </Button>
        ) : null}
        <div
          className={
            selectedGroup ? "grid gap-6 lg:grid-cols-[1fr_300px]" : "max-w-2xl"
          }
        >
          <CommunityComposer
            groups={groups}
            initialGroupId={initialGroupId ?? detail.data?.id}
            initialPlanId={initialPlanId}
          />
          {selectedGroup && <CommunityRulesSidebar group={selectedGroup} />}
        </div>
      </div>
    </CommunityErrorBoundary>
  );
}

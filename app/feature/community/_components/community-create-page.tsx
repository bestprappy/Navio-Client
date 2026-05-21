"use client";

import { useAtomValue } from "jotai";

import { createPostDraftAtom, createdGroupsAtom } from "./community-atoms";

import { CommunityErrorBoundary } from "./community-error-boundary";

import { mockCommunityGroups } from "./data";
import { useCommunityGroups } from "./community-queries";
import { Button } from "@/components/ui/button";
import { CommunityComposer } from "../create/community-composer";
import { CommunityRulesSidebar } from "../create/community-rules-sidebar";

export function CommunityCreatePage() {
  const createdGroups = useAtomValue(createdGroupsAtom);
  const groupsQuery = useCommunityGroups("", createdGroups);
  const groups = groupsQuery.data ?? [...createdGroups, ...mockCommunityGroups];

  const postDraft = useAtomValue(createPostDraftAtom);
  const selectedGroup = groups.find((g) => g.id === postDraft.groupId);

  return (
    <CommunityErrorBoundary>
      <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Create post
          </h1>
          <Button variant="ghost" size="sm" className="font-semibold">
            Drafts
          </Button>
        </div>

        <div
          className={
            selectedGroup
              ? "grid gap-6 lg:grid-cols-[1fr_300px]"
              : "max-w-2xl"
          }
        >
          <CommunityComposer groups={groups} />
          {selectedGroup && <CommunityRulesSidebar group={selectedGroup} />}
        </div>
      </div>
    </CommunityErrorBoundary>
  );
}

"use client";

import { useAtomValue } from "jotai";

import { createdGroupsAtom } from "./community-atoms";
import { CommunityComposer } from "./community-composer";
import { CommunityErrorBoundary } from "./community-error-boundary";
import { mockCommunityGroups } from "./data";
import { useCommunityGroups } from "./community-queries";

export function CommunityCreatePage() {
  const createdGroups = useAtomValue(createdGroupsAtom);
  const groupsQuery = useCommunityGroups("", createdGroups);
  const groups = groupsQuery.data ?? [...createdGroups, ...mockCommunityGroups];

  return (
    <CommunityErrorBoundary>
      <div className="mx-auto w-full max-w-[92rem] p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Create
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Start a discussion or create a new community group.
          </p>
        </div>

        <CommunityComposer groups={groups} />
      </div>
    </CommunityErrorBoundary>
  );
}

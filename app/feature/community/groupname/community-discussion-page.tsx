"use client";

import { toCommunityGroup } from "../_components/community-api";
import { useCommunityGroup } from "../_components/community-group-queries";
import { useCommunityPost } from "../_components/community-queries";
import { CommunityErrorBoundary } from "../_components/community-error-boundary";
import { CommunityGroupLoading, CommunityQueryError } from "../_components/community-query-state";
import { CommunityWorkspace } from "../_components/community-workspace";
import { CommunityGroupSidebar } from "./_components/community-group-sidebar";
import { CommunityPostDetailCard } from "./_components/community-post-detail-card";
import { CommunityCommentThread } from "./_components/community-comment-thread";

export function CommunityDiscussionPage({ groupName, discussionTitle }: { groupName: string; discussionTitle: string }) {
  const detail = useCommunityGroup(groupName);
  const query = useCommunityPost(discussionTitle);
  const group = detail.data ? toCommunityGroup(detail.data) : null;
  const post = query.data;
  return <CommunityErrorBoundary>
    <CommunityWorkspace>
      <CommunityWorkspace.Content>
        {detail.isPending || query.isPending ? <CommunityGroupLoading /> : null}
        <CommunityQueryError error={detail.error ?? query.error} onRetry={() => { void detail.refetch(); void query.refetch(); }} />
        {group && post && post.groupId !== group.id ? <p role="alert">This post does not belong to this community.</p> : null}
        {group && post && post.groupId === group.id ? <>
          <CommunityPostDetailCard post={post} group={group} />
          <CommunityCommentThread post={post} group={group} />
        </> : null}
      </CommunityWorkspace.Content>
      <CommunityWorkspace.Aside>
        {group?.profile ? <CommunityGroupSidebar group={group} profile={group.profile} /> : null}
      </CommunityWorkspace.Aside>
    </CommunityWorkspace>
  </CommunityErrorBoundary>;
}

"use client";

import { CommunityPostCard } from "../../_components/community-post-card";
import type { CommunityPost, CommunityGroup, CommunityComment } from "../../_components/data";

export function CommunityPostDetailCard({ post, group }: { post: CommunityPost; group: CommunityGroup; comments?: CommunityComment[] }) {
  return <CommunityPostCard post={post} group={group} detail />;
}

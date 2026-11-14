"use client";

import { CommunityQueryError } from "../../_components/community-query-state";
import {
  CommentComposer,
  type CommentComposerProps,
} from "@/components/comment-tree/comment-composer";

type CommunityCommentComposerProps = Omit<CommentComposerProps, "error" | "maxLength" | "showCount"> & {
  error?: Error | null;
};

export function CommunityCommentComposer({ error = null, ...props }: CommunityCommentComposerProps) {
  return (
    <CommentComposer
      {...props}
      error={error ? <CommunityQueryError error={error} /> : null}
    />
  );
}

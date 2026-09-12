"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CommunityQueryError } from "../../_components/community-query-state";
import { CommunityUserLabel } from "../../_components/community-user-label";
import { CommunityVoteButtons } from "../../_components/community-post-actions";
import { useCommunityComments, usePostMutation } from "../../_components/community-queries";
import { useCommunityIdentity } from "../../_components/community-group-queries";
import { CommunityMembershipButton } from "../../_components/community-membership-button";
import { formatRelativeTime, type CommunityPost, type CommunityGroup, type CommunityComment } from "../../_components/data";
import { CommunityCommentComposer } from "./community-comment-composer";

export function CommunityCommentThread({ post, group }: { post: CommunityPost; group: CommunityGroup }) {
  const query = useCommunityComments(post.id);
  const [reply, setReply] = useState<CommunityComment | null>(null);
  return <Card id="discussion">
    <CardHeader><CardTitle>Discussion</CardTitle></CardHeader>
    <CardContent className="space-y-4">
      {group.status === "archived" ? <p className="text-sm text-muted-foreground">This archived discussion is read-only.</p> : group.joined ? <CommunityCommentComposer postId={post.id} parent={reply} onComplete={() => setReply(null)} /> :
        <div className="space-y-2"><p className="text-sm text-muted-foreground">Join this community to comment and reply.</p><CommunityMembershipButton group={group} /></div>}
      <CommunityQueryError error={query.error} onRetry={() => void query.refetch()} />
      {query.isPending ? <p role="status">Loading comments…</p> : null}
      {!query.isPending && !query.isError && !query.comments.length ? <p className="text-sm text-muted-foreground">No comments yet. Start the discussion.</p> : null}
      {query.comments.map((comment) => <CommentItem key={comment.id} comment={comment} group={group} onReply={() => { setReply(comment); document.getElementById("discussion")?.scrollIntoView({ behavior: "smooth" }); }} />)}
      {query.hasNextPage ? <Button variant="outline" disabled={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>Load more comments</Button> : null}
    </CardContent>
  </Card>;
}

function CommentItem({ comment, group, onReply }: { comment: CommunityComment; group: CommunityGroup; onReply: () => void }) {
  const { identity } = useCommunityIdentity();
  const mutation = usePostMutation();
  const [open, setOpen] = useState(false);
  const removable = group.status !== "archived" && group.joined && (identity === comment.authorId || group.role === "admin" || group.role === "moderator");
  return <article id={`comment-${comment.id}`} className="space-y-2 rounded-lg border border-border p-4">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <CommunityUserLabel userId={comment.authorId} />
      <time dateTime={comment.createdAt} className="text-xs text-muted-foreground">{formatRelativeTime(comment.createdAt)}</time>
    </div>
    {comment.parentCommentId ? <a href={`#comment-${comment.parentCommentId}`} className="text-xs text-muted-foreground underline">Reply to an earlier comment</a> : null}
    <p className="whitespace-pre-wrap break-words text-sm leading-6">{comment.deleted ? "Comment deleted." : comment.body}</p>
    {!comment.deleted ? <div className="flex flex-wrap items-start gap-2">
      <CommunityVoteButtons path={`/${comment.postId}/comments/${comment.id}/vote`} score={comment.upvotes} vote={comment.viewerVote ?? 0} disabled={group.status === "archived"} />
      <Button variant="ghost" size="sm" disabled={!group.joined || group.status === "archived"} onClick={onReply}>Reply</Button>
      {removable ? <Dialog open={open} onOpenChange={(value) => { if (!mutation.isPending) setOpen(value); }}>
        <DialogTrigger render={<Button variant="ghost" size="sm" />}>Delete</DialogTrigger>
        <DialogContent><DialogHeader><DialogTitle>Delete comment?</DialogTitle><DialogDescription>The text will be removed. Replies will remain visible.</DialogDescription></DialogHeader>
          <CommunityQueryError error={mutation.error} />
          <DialogFooter><Button variant="outline" disabled={mutation.isPending} onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="destructive" disabled={mutation.isPending} onClick={() => mutation.mutate({ path: `/${comment.postId}/comments/${comment.id}`, method: "DELETE" }, { onSuccess: () => setOpen(false) })}>Delete comment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> : null}
    </div> : null}
  </article>;
}

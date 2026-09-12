"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { CommunityFormField } from "../../_components/community-form-field";
import { CommunityQueryError } from "../../_components/community-query-state";
import { usePostMutation } from "../../_components/community-queries";
import type { CommunityComment } from "../../_components/data";

const schema = z.object({ body: z.string().trim().min(1, "Write a comment.").max(10000) });

export function CommunityCommentComposer({ postId, parent, onComplete }: {
  postId: string; parent: CommunityComment | null; onComplete: () => void;
}) {
  const mutation = usePostMutation();
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { body: "" } });
  return <form className="space-y-3" onSubmit={form.handleSubmit((values) => mutation.mutate({
    path: `/${postId}/comments`, method: "POST", body: { ...values, parentCommentId: parent?.id ?? null },
  }, { onSuccess: () => { form.reset(); onComplete(); } }))}>
    {parent ? <div className="flex items-center justify-between gap-2 rounded-lg bg-muted p-3">
      <p className="line-clamp-2 text-sm">Replying to: {parent.body}</p>
      <Button type="button" variant="ghost" disabled={mutation.isPending} onClick={onComplete}>Cancel reply</Button>
    </div> : null}
    <CommunityFormField control={form.control} name="body" label={parent ? "Your reply" : "Add a comment"} multiline disabled={mutation.isPending} />
    <CommunityQueryError error={mutation.error} />
    <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Posting…" : parent ? "Post reply" : "Post comment"}</Button>
  </form>;
}

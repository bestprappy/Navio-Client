"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { CommunityFormField } from "./community-form-field";
import { CommunityQueryError } from "./community-query-state";
import { postFormSchema } from "./community-post-api";
import { usePostMutation } from "./community-queries";
import type { CommunityPost } from "./data";

export function CommunityPostEditor({ post, canEdit, canDelete }: { post: CommunityPost; canEdit: boolean; canDelete: boolean }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const mutation = usePostMutation();
  const router = useRouter();
  const form = useForm({ resolver: zodResolver(postFormSchema.pick({ title: true, body: true })), defaultValues: { title: post.title, body: post.body } });
  return <>
    {canEdit ? <Dialog open={editOpen} onOpenChange={(open) => { if (!mutation.isPending) { setEditOpen(open); mutation.reset(); form.reset({ title: post.title, body: post.body }); } }}>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>Edit</DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit post</DialogTitle><DialogDescription>Update your title and post text.</DialogDescription></DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit((body) => mutation.mutate({ path: `/${post.id}`, method: "PATCH", body }, { onSuccess: () => setEditOpen(false) }))}>
          <CommunityFormField control={form.control} name="title" label="Title" disabled={mutation.isPending} />
          <CommunityFormField control={form.control} name="body" label="Post text" multiline disabled={mutation.isPending} />
          <CommunityQueryError error={mutation.error} />
          <DialogFooter><Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => setEditOpen(false)}>Cancel</Button><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving…" : "Save changes"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog> : null}
    {canDelete ? <Dialog open={deleteOpen} onOpenChange={(open) => { if (!mutation.isPending) { setDeleteOpen(open); mutation.reset(); } }}>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>Delete</DialogTrigger>
      <DialogContent><DialogHeader><DialogTitle>Delete this post?</DialogTitle><DialogDescription>The post, its picture, comments and votes will be removed permanently.</DialogDescription></DialogHeader>
        <CommunityQueryError error={mutation.error} />
        <DialogFooter><Button variant="outline" disabled={mutation.isPending} onClick={() => setDeleteOpen(false)}>Cancel</Button><Button variant="destructive" disabled={mutation.isPending} onClick={() => mutation.mutate({ path: `/${post.id}`, method: "DELETE" }, { onSuccess: () => { setDeleteOpen(false); router.push(`/community/${post.groupSlug}`); } })}>{mutation.isPending ? "Deleting…" : "Delete post"}</Button></DialogFooter>
      </DialogContent>
    </Dialog> : null}
  </>;
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CommunityFormField } from "./community-form-field";
import { CommunityQueryError } from "./community-query-state";
import { postFormSchema } from "./community-post-api";
import { usePostMutation } from "./community-queries";
import type { CommunityPost } from "./data";

type CommunityPostEditorProps = {
  post: CommunityPost;
  canEdit: boolean;
  canDelete: boolean;
  /** Detail pages leave the deleted post; feed cards simply drop out of the refreshed list. */
  redirectOnDelete?: boolean;
};

/** Overflow menu for a post's author or moderators; each action confirms in its own dialog. */
export function CommunityPostEditor({ post, canEdit, canDelete, redirectOnDelete = true }: CommunityPostEditorProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const mutation = usePostMutation();
  const router = useRouter();
  const form = useForm({ resolver: zodResolver(postFormSchema.pick({ title: true, body: true })), defaultValues: { title: post.title, body: post.body } });
  if (!canEdit && !canDelete) return null;
  return <>
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button type="button" variant="ghost" size="icon-sm" className="rounded-full text-muted-foreground" aria-label="More post actions" />}>
        <MoreHorizontal aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {canEdit ? <DropdownMenuItem onClick={() => { mutation.reset(); form.reset({ title: post.title, body: post.body }); setEditOpen(true); }}>
          <Pencil aria-hidden="true" />Edit post
        </DropdownMenuItem> : null}
        {canEdit && canDelete ? <DropdownMenuSeparator /> : null}
        {canDelete ? <DropdownMenuItem variant="destructive" onClick={() => { mutation.reset(); setDeleteOpen(true); }}>
          <Trash2 aria-hidden="true" />Delete post
        </DropdownMenuItem> : null}
      </DropdownMenuContent>
    </DropdownMenu>
    <Dialog open={editOpen} onOpenChange={(open) => { if (!mutation.isPending) setEditOpen(open); }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit post</DialogTitle><DialogDescription>Update your title and post text.</DialogDescription></DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit((body) => mutation.mutate({ path: `/${post.id}`, method: "PATCH", body }, { onSuccess: () => setEditOpen(false) }))}>
          <CommunityFormField control={form.control} name="title" label="Title" disabled={mutation.isPending} />
          <CommunityFormField control={form.control} name="body" label="Post text" multiline disabled={mutation.isPending} />
          <CommunityQueryError error={mutation.error} />
          <DialogFooter><Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => setEditOpen(false)}>Cancel</Button><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving…" : "Save changes"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    <Dialog open={deleteOpen} onOpenChange={(open) => { if (!mutation.isPending) setDeleteOpen(open); }}>
      <DialogContent><DialogHeader><DialogTitle>Delete this post?</DialogTitle><DialogDescription>The post, its picture, comments and votes will be removed permanently.</DialogDescription></DialogHeader>
        <CommunityQueryError error={mutation.error} />
        <DialogFooter><Button variant="outline" disabled={mutation.isPending} onClick={() => setDeleteOpen(false)}>Cancel</Button><Button variant="destructive" disabled={mutation.isPending} onClick={() => mutation.mutate({ path: `/${post.id}`, method: "DELETE" }, { onSuccess: () => { setDeleteOpen(false); if (redirectOnDelete) router.push(`/community/${post.groupSlug}`); } })}>{mutation.isPending ? "Deleting…" : "Delete post"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}

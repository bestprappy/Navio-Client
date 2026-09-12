"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAtom } from "jotai";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { LabeledSelect } from "@/components/labeled-select";
import { ImageFilePicker } from "@/components/image-file-picker";
import { createPostDraftAtom } from "../_components/community-atoms";
import { createPost, postFormSchema, type PostFormValues } from "../_components/community-post-api";
import { CommunityFormField } from "../_components/community-form-field";
import { CommunityQueryError } from "../_components/community-query-state";
import { CommunityMembershipButton } from "../_components/community-membership-button";
import { useCommunityIdentity } from "../_components/community-group-queries";
import { defaultCreatePostDraft, explorePlanSharedTrips, getCommunityPostHref, type CommunityGroup } from "../_components/data";

export function CommunityComposer({ groups, initialGroupId = null, initialPlanId = null }: {
  groups: CommunityGroup[]; initialGroupId?: string | null; initialPlanId?: string | null;
}) {
  const router = useRouter();
  const cache = useQueryClient();
  const { authenticated, identity } = useCommunityIdentity();
  const publishAttempt = useRef<{ signature: string; file: File | null; id: string } | null>(null);
  const [draft, setDraft] = useAtom(createPostDraftAtom);
  const [groupId, setGroupId] = useState(initialGroupId ?? draft.groupId);
  const [flairId, setFlairId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [tripId, setTripId] = useState(
    explorePlanSharedTrips.find((trip) => trip.id === initialPlanId || trip.sourcePlanId === initialPlanId)?.id ?? "",
  );
  const selectedGroupId = groupId || initialGroupId || "";
  const group = groups.find((item) => item.id === selectedGroupId);
  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: { title: draft.title, body: draft.body, linkUrl: "" },
  });
  const mutation = useMutation({
    mutationFn: (values: PostFormValues) => {
      if (!group?.slug || !group.joined) throw new Error("Join a community before posting.");
      const signature = JSON.stringify({ identity, group: group.slug, values, flairId, tripId });
      if (!publishAttempt.current || publishAttempt.current.signature !== signature || publishAttempt.current.file !== file) {
        publishAttempt.current = { signature, file, id: crypto.randomUUID() };
      }
      return createPost(group.slug, values, flairId || null, tripId || null, file, publishAttempt.current.id);
    },
    onSuccess: async (post) => {
      setDraft({ ...defaultCreatePostDraft });
      await cache.invalidateQueries({ queryKey: ["community"] });
      router.push(getCommunityPostHref({ name: post.groupName ?? "", slug: post.groupSlug }, post));
    },
  });
  return (
    <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
      <LabeledSelect label="Community" value={selectedGroupId} disabled={mutation.isPending}
        onChange={(value) => { setGroupId(value); setFlairId(""); setDraft((previous) => ({ ...previous, groupId: value })); }}
        options={[{ value: "", label: "Select a community" }, ...groups.map((item) => ({ value: item.id, label: item.name }))]} />
      {group && !group.joined ? <div className="space-y-2 rounded-lg border border-border p-3">
        <p className="text-sm text-muted-foreground">Join this community to publish a post.</p>
        <CommunityMembershipButton group={group} />
      </div> : null}
      <CommunityFormField control={form.control} name="title" label="Title" disabled={mutation.isPending} />
      <CommunityFormField control={form.control} name="body" label="Post text" multiline disabled={mutation.isPending} />
      <CommunityFormField control={form.control} name="linkUrl" label="Link (optional)" disabled={mutation.isPending} />
      {group?.postFlairs.length ? <LabeledSelect label="Flair (optional)" value={flairId} onChange={setFlairId} disabled={mutation.isPending}
        options={[{ value: "", label: "No flair" }, ...group.postFlairs.map((flair) => ({ value: flair.id, label: flair.label }))]} /> : null}
      <ImageFilePicker file={file} onChange={setFile} label="Post banner picture (optional)" disabled={mutation.isPending} />
      <LabeledSelect label="Explore plan (optional)" value={tripId} onChange={setTripId} disabled={mutation.isPending}
        options={[{ value: "", label: "No plan attached" }, ...explorePlanSharedTrips.map((trip) => ({ value: trip.id, label: trip.title }))]} />
      <CommunityQueryError error={mutation.error} />
      {group?.status === "archived" ? <p role="status" className="text-sm text-muted-foreground">Archived communities are read-only.</p> : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => router.push(group?.slug ? `/community/${group.slug}` : "/community")}>Cancel</Button>
        <Button type="submit" disabled={!authenticated || !group?.joined || group.status === "archived" || mutation.isPending}>
          {mutation.isPending ? "Publishing…" : "Publish post"}
        </Button>
      </div>
    </form>
  );
}

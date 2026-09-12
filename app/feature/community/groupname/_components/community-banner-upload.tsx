"use client";

import { useState } from "react";
import Image from "next/image";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ImageFilePicker } from "@/components/image-file-picker";
import { communityRequest, groupDetailSchema, type GroupDetail } from "../../_components/community-api";
import { CommunityQueryError } from "../../_components/community-query-state";

export function CommunityBannerUpload({ group }: { group: GroupDetail }) {
  const [file, setFile] = useState<File | null>(null);
  const cache = useQueryClient();
  const mutation = useMutation({
    mutationKey: ["community", "settings", group.slug],
    scope: { id: `community-settings-${group.slug}` },
    mutationFn: async (remove: boolean) => {
      if (remove) return communityRequest(`/${group.slug}/banner`, z.null(), { method: "DELETE" });
      if (!file) throw new Error("Choose a banner picture.");
      const body = new FormData(); body.append("file", file);
      return communityRequest(`/${group.slug}/banner`, groupDetailSchema, { method: "POST", body });
    },
    onSuccess: async () => { setFile(null); await cache.invalidateQueries({ queryKey: ["community"] }); },
  });
  return <div className="space-y-3">
    {group.bannerMediaId ? <Image src={`/api/groups/${group.slug}/banner?v=${group.bannerMediaId}`} unoptimized width={1200} height={300} alt="Current community banner" className="max-h-48 w-full rounded-lg object-cover" /> : null}
    <ImageFilePicker file={file} onChange={setFile} label="Community banner" disabled={mutation.isPending} />
    <CommunityQueryError error={mutation.error} />
    {mutation.isSuccess ? <p role="status" className="text-sm text-success">Banner updated.</p> : null}
    <div className="flex flex-wrap gap-2">
      <Button type="button" disabled={!file || mutation.isPending} onClick={() => mutation.mutate(false)}>{mutation.isPending ? "Saving…" : "Upload banner"}</Button>
      {group.bannerMediaId || group.bannerUrl ? <Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate(true)}>Remove banner</Button> : null}
    </div>
  </div>;
}

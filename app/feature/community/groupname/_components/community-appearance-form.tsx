"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  communityPictureUrl,
  type CommunityPictureSlot,
  type GroupDetail,
} from "../../_components/community-api";
import { useCommunityPicture } from "../../_components/community-group-queries";
import { CommunityPictureInput } from "../../_components/community-picture-input";
import { CommunityQueryError } from "../../_components/community-query-state";

const COPY: Record<CommunityPictureSlot, { label: string; hint: string; saved: string; removed: string }> = {
  banner: { label: "Banner", hint: "Wide picture, 4:1 works best", saved: "Banner saved.", removed: "Banner removed." },
  icon: { label: "Icon", hint: "Square, shown in a circle", saved: "Icon saved.", removed: "Icon removed." },
};

/** One picture slot: choose a file, preview it in place, then save or discard. */
function PictureSlot({ group, slot }: { group: GroupDetail; slot: CommunityPictureSlot }) {
  const [file, setFile] = useState<File | null>(null);
  const mutation = useCommunityPicture(group.slug, slot);
  const mediaId = slot === "icon" ? group.iconMediaId : group.bannerMediaId;
  const current = communityPictureUrl(group.slug, slot, mediaId);
  const copy = COPY[slot];

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-well p-4">
      <CommunityPictureInput
        label={copy.label}
        hint={copy.hint}
        shape={slot}
        file={file}
        currentUrl={current}
        disabled={mutation.isPending}
        onFileChange={(next) => {
          mutation.reset();
          setFile(next);
        }}
        onRemoveCurrent={() => mutation.mutate(null)}
      />
      <CommunityQueryError error={mutation.error} />
      <div className="flex flex-wrap items-center justify-end gap-2">
        {mutation.isSuccess && !file ? (
          <p role="status" className="mr-auto text-sm text-success">
            {mutation.variables ? copy.saved : copy.removed}
          </p>
        ) : null}
        {file ? (
          <Button
            type="button"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate(file, { onSuccess: () => setFile(null) })}
          >
            {mutation.isPending ? "Saving…" : `Save ${copy.label.toLowerCase()}`}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function CommunityAppearanceForm({ group }: { group: GroupDetail }) {
  return (
    <div className="flex flex-col gap-4">
      <PictureSlot group={group} slot="banner" />
      <PictureSlot group={group} slot="icon" />
      <p className="text-xs text-muted-foreground">PNG or JPEG, up to 5 MB and 4096 pixels per side.</p>
    </div>
  );
}

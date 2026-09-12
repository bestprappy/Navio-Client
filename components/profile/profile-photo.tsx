"use client";

import { useId, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageFilePicker } from "@/components/image-file-picker";
import { uploadProfilePicture, removeProfilePicture } from "@/lib/profile-api";
import type { UserProfile } from "@/types/profile";
import { ACCOUNT_STATUS_LABELS } from "./data";

type ProfilePhotoProps = {
  imageUrl: string | null; displayName: string; status: string;
  profile: UserProfile; onSaved: (profile: UserProfile) => void;
};

export function ProfilePhoto({ imageUrl, displayName, status, profile, onSaved }: ProfilePhotoProps) {
  const id = useId();
  const [file, setFile] = useState<File | null>(null);
  const cache = useQueryClient();
  const mutation = useMutation({
    scope: { id: `profile-save-${profile.id}` },
    mutationFn: (remove: boolean) => {
      if (remove) return removeProfilePicture();
      if (!file) throw new Error("Choose a profile picture.");
      return uploadProfilePicture(file);
    },
    onSuccess: async (updated) => {
      onSaved(updated); setFile(null);
      await cache.invalidateQueries({ queryKey: ["community-user"] });
    },
  });
  const initials = displayName.trim().split(/\s+/).slice(0, 2).map((part) => Array.from(part)[0] ?? "").join("").toUpperCase() || "N";
  return <section aria-labelledby={`${id}-label`} className="space-y-4">
    <div className="flex items-center gap-4">
      <Avatar className="size-20 shrink-0 sm:size-24">
        {imageUrl ? <AvatarImage src={imageUrl} alt="" /> : null}
        <AvatarFallback className="text-2xl font-semibold">{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 space-y-2">
        <h2 id={`${id}-label`} className="break-words text-base font-semibold">{displayName || "Your profile"}</h2>
        <Badge variant={status.toLowerCase() === "active" ? "secondary" : "destructive"}>{ACCOUNT_STATUS_LABELS[status.toLowerCase()] ?? status}</Badge>
      </div>
    </div>
    <ImageFilePicker file={file} onChange={setFile} disabled={mutation.isPending} label="Profile picture" />
    {mutation.error ? <p role="alert" className="text-sm text-destructive">{mutation.error.message}</p> : null}
    {mutation.isSuccess ? <p role="status" className="text-sm text-success">Profile picture updated.</p> : null}
    <div className="flex flex-wrap gap-2">
      <Button type="button" disabled={!file || mutation.isPending} onClick={() => mutation.mutate(false)}>{mutation.isPending ? "Saving…" : "Upload picture"}</Button>
      {profile.avatarMediaId ? <Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate(true)}>Remove picture</Button> : null}
    </div>
  </section>;
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";

import { AvatarCropper } from "@/components/profile/avatar-cropper";
import { Button } from "@/components/ui/button";
import {
  AvatarImageError,
  BANNER_ASPECT,
  decodeAvatarSource,
  renderBanner,
  type AvatarCrop,
} from "@/lib/avatar-crop";
import { removeProfileBanner, uploadProfileBanner } from "@/lib/profile-api";
import type { UserProfile } from "@/types/profile";

type PickedImage = { bitmap: ImageBitmap; url: string };

type BannerEditorProps = {
  profile: UserProfile;
  onSaved: (profile: UserProfile) => Promise<void> | void;
};

/**
 * Banner upload, replace, reposition and removal. Every image is cropped to
 * 3:1 and re-encoded in the browser, so any phone photo uploads as a small
 * 1500 x 500 JPEG and EXIF orientation is already applied.
 */
export function BannerEditor({ profile, onSaved }: BannerEditorProps) {
  const input = useRef<HTMLInputElement>(null);
  const pickedRef = useRef<PickedImage | null>(null);
  const [picked, setPicked] = useState<PickedImage | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const closePicked = useCallback(() => {
    const current = pickedRef.current;
    if (current) {
      current.bitmap.close();
      URL.revokeObjectURL(current.url);
    }
    pickedRef.current = null;
    setPicked(null);
  }, []);
  useEffect(() => closePicked, [closePicked]);

  const upload = useMutation({
    scope: { id: `profile-banner-${profile.id}` },
    mutationFn: async ({ bitmap, crop }: { bitmap: ImageBitmap; crop: AvatarCrop }) => {
      setProgress(0);
      return uploadProfileBanner(await renderBanner(bitmap, crop), setProgress);
    },
    onSuccess: async (updated) => {
      await onSaved(updated);
      closePicked();
      setAnnouncement("Banner saved.");
    },
    onError: (error) => console.error("Banner upload failed.", { component: "BannerEditor", error }),
    onSettled: () => setProgress(null),
  });

  const remove = useMutation({
    scope: { id: `profile-banner-${profile.id}` },
    mutationFn: removeProfileBanner,
    onSuccess: async (updated) => {
      await onSaved(updated);
      setAnnouncement("Banner removed.");
    },
    onError: (error) => console.error("Banner removal failed.", { component: "BannerEditor", error }),
  });

  const open = async (file: File | undefined) => {
    if (!file) return;
    setPickError(null);
    setAnnouncement("");
    upload.reset();
    remove.reset();
    try {
      const bitmap = await decodeAvatarSource(file);
      closePicked();
      const next = { bitmap, url: URL.createObjectURL(file) };
      pickedRef.current = next;
      setPicked(next);
    } catch (error) {
      setPickError(error instanceof AvatarImageError ? error.message : "That file could not be opened.");
    }
  };

  const busy = upload.isPending || remove.isPending;
  const bannerSrc = profile.bannerMediaId
    ? `/api/users/${encodeURIComponent(profile.id)}/banner?v=${encodeURIComponent(profile.bannerMediaId)}`
    : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[3/1] w-full overflow-hidden rounded-[var(--card-radius-md)] bg-well ring-1 ring-border">
        {bannerSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bannerSrc} alt="Your profile banner" className="size-full object-cover" />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-1 text-center text-sm text-muted-foreground">
            <ImagePlus aria-hidden="true" className="size-6" />
            No banner yet
          </div>
        )}
        {remove.isPending ? (
          <span className="absolute inset-0 flex items-center justify-center bg-scrim/60">
            <LoaderCircle aria-hidden="true" className="size-6 animate-spin text-on-media motion-reduce:animate-none" />
          </span>
        ) : null}
      </div>

      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          void open(file);
        }}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" className="h-10 px-4" disabled={busy} onClick={() => input.current?.click()}>
          <ImagePlus aria-hidden="true" />
          {profile.bannerMediaId ? "Replace banner" : "Add banner"}
        </Button>
        {profile.bannerMediaId ? (
          <Button type="button" variant="ghost" className="h-10 px-4 text-muted-foreground" disabled={busy} onClick={() => remove.mutate()}>
            <Trash2 aria-hidden="true" />
            {remove.isPending ? "Removing…" : "Remove banner"}
          </Button>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">JPEG, PNG or WebP up to 25 MB. You can reposition it before saving.</p>
      {pickError ?? remove.error?.message ? (
        <p role="alert" className="text-sm text-destructive">{pickError ?? remove.error?.message}</p>
      ) : null}
      <span role="status" className="sr-only">{announcement}</span>

      <AvatarCropper
        key={picked?.url ?? "closed"}
        source={picked}
        aspect={BANNER_ASPECT}
        mask="frame"
        title="Position your banner"
        description="Drag the image or use the arrow keys to move it. Zoom to choose what fills the banner."
        saveLabel="Save banner"
        savingLabel="Uploading banner…"
        progress={progress}
        saving={upload.isPending}
        error={upload.error?.message ?? null}
        onCancel={() => {
          upload.reset();
          closePicked();
        }}
        onSave={(crop) => {
          if (picked) upload.mutate({ bitmap: picked.bitmap, crop });
        }}
      />
    </div>
  );
}

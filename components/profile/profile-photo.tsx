"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AvatarImageError,
  decodeAvatarSource,
  renderAvatar,
  type AvatarCrop,
} from "@/lib/avatar-crop";
import { removeProfilePicture, uploadProfilePictureWithProgress } from "@/lib/profile-api";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types/profile";
import { AvatarCropper } from "./avatar-cropper";

type ProfilePhotoProps = {
  profile: UserProfile;
  /** Shown when no Navio photo is stored, such as an identity-provider picture. */
  fallbackImageUrl: string | null;
  onSaved: (profile: UserProfile) => void;
};

type PickedPhoto = { bitmap: ImageBitmap; url: string };

export function profileInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => Array.from(part)[0] ?? "")
      .join("")
      .toUpperCase() || "N"
  );
}

function describeError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "The photo could not be saved. Try again.";
}

/**
 * The photo slot on the profile card. Every upload goes through the cropper,
 * which re-encodes the photo in the browser: the profile service then always
 * receives a small, upright, square JPEG regardless of what the camera wrote.
 */
export function ProfilePhoto({ profile, fallbackImageUrl, onSaved }: ProfilePhotoProps) {
  const input = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [picked, setPicked] = useState<PickedPhoto | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [progress, setProgress] = useState<number | null>(null);

  // Mirrors `picked` so cleanup can release the bitmap outside a state updater.
  const pickedRef = useRef<PickedPhoto | null>(null);
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

  const refreshAuthorCaches = () =>
    queryClient.invalidateQueries({ queryKey: ["community-user"] });

  const upload = useMutation({
    scope: { id: `profile-save-${profile.id}` },
    mutationFn: async ({ bitmap, crop }: { bitmap: ImageBitmap; crop: AvatarCrop }) => {
      setProgress(0);
      return uploadProfilePictureWithProgress(await renderAvatar(bitmap, crop), setProgress);
    },
    onSettled: () => setProgress(null),
    onSuccess: async (updated) => {
      onSaved(updated);
      closePicked();
      setAnnouncement("Photo saved.");
      await refreshAuthorCaches();
    },
    onError: (error) => {
      console.error("Profile photo upload failed.", { component: "ProfilePhoto", error });
    },
  });

  const remove = useMutation({
    scope: { id: `profile-save-${profile.id}` },
    mutationFn: removeProfilePicture,
    onSuccess: async (updated) => {
      onSaved(updated);
      setAnnouncement("Photo removed.");
      await refreshAuthorCaches();
    },
    onError: (error) => {
      console.error("Profile photo removal failed.", { component: "ProfilePhoto", error });
    },
  });

  const openFile = async (file: File | undefined) => {
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

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    void openFile(event.dataTransfer.files[0]);
  };

  const busy = upload.isPending || remove.isPending;
  const imageUrl = profile.avatarMediaId
    ? `/api/users/me/picture?v=${profile.avatarMediaId}`
    : fallbackImageUrl;
  const inlineError = pickError ?? (remove.error ? describeError(remove.error) : null);

  return (
    <div className="flex flex-row items-start gap-4 sm:flex-col sm:gap-3">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "relative size-24 shrink-0 overflow-hidden rounded-[var(--card-radius-md)] bg-muted ring-1 ring-border sm:size-36",
          dragging && "ring-2 ring-primary",
        )}
      >
        {imageUrl ? (
          // Served through the authenticated proxy with no-store; the optimiser cannot fetch it.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={`Profile photo of ${profile.displayName}`} className="size-full object-cover" />
        ) : (
          <span
            aria-hidden="true"
            className="flex size-full items-center justify-center text-3xl font-semibold text-muted-foreground sm:text-4xl"
          >
            {profileInitials(profile.displayName)}
          </span>
        )}
        {remove.isPending ? (
          <span className="absolute inset-0 flex items-center justify-center bg-scrim/60">
            <LoaderCircle aria-hidden="true" className="size-6 animate-spin text-on-media motion-reduce:animate-none" />
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col gap-2 sm:w-36">
        <input
          ref={input}
          type="file"
          accept="image/*"
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            void openFile(file);
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="h-10 justify-start px-3 sm:justify-center"
          disabled={busy}
          onClick={() => input.current?.click()}
        >
          <Camera aria-hidden="true" />
          {profile.avatarMediaId ? "Change photo" : "Add photo"}
        </Button>
        {profile.avatarMediaId ? (
          <Button
            type="button"
            variant="ghost"
            className="h-10 justify-start px-3 text-muted-foreground sm:justify-center"
            disabled={busy}
            onClick={() => {
              setPickError(null);
              setAnnouncement("");
              remove.mutate();
            }}
          >
            {remove.isPending ? "Removing…" : "Remove photo"}
          </Button>
        ) : null}
        {inlineError ? (
          <p role="alert" className="text-xs leading-relaxed text-destructive">
            {inlineError}
          </p>
        ) : null}
        <span role="status" className="sr-only">
          {announcement}
        </span>
      </div>

      <AvatarCropper
        key={picked?.url ?? "closed"}
        source={picked}
        saving={upload.isPending}
        progress={progress}
        error={upload.error ? describeError(upload.error) : null}
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

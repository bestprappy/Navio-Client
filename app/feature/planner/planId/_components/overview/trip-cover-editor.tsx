"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImageOff, ImagePlus, LoaderCircle, Pencil } from "lucide-react";

import { AvatarCropper } from "@/components/profile/avatar-cropper";
import { notify } from "@/components/toast/notify";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AvatarImageError, BANNER_ASPECT, decodeAvatarSource } from "@/lib/avatar-crop";
import { useTripCover } from "./use-trip-cover";

type PickedImage = { bitmap: ImageBitmap; url: string };

type TripCoverEditorProps = {
  tripId: string;
  hasCustomCover: boolean;
  /** Whether removing the upload falls back to a destination photo or to the plain banner. */
  hasDestinationPhoto: boolean;
};

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/heic,image/heif";
const menuItemClass = "min-h-10 gap-3 px-3 text-foreground data-highlighted:bg-muted data-highlighted:text-foreground";

/**
 * The banner's edit button: pick a photo, frame it in the 3:1 cropper, upload
 * it, or go back to the destination photo. Any phone photo is re-encoded in the
 * browser as a 1500 x 500 JPEG before it is sent.
 */
export function TripCoverEditor({ tripId, hasCustomCover, hasDestinationPhoto }: TripCoverEditorProps) {
  const input = useRef<HTMLInputElement>(null);
  const pickedRef = useRef<PickedImage | null>(null);
  const [picked, setPicked] = useState<PickedImage | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const { upload, remove, progress } = useTripCover(tripId);

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

  const open = async (file: File | undefined) => {
    if (!file) return;
    setAnnouncement("");
    upload.reset();
    try {
      const bitmap = await decodeAvatarSource(file);
      closePicked();
      const next = { bitmap, url: URL.createObjectURL(file) };
      pickedRef.current = next;
      setPicked(next);
    } catch (error) {
      notify.error({
        title: "Photo not opened",
        description: error instanceof AvatarImageError ? error.message : "That file could not be opened. Try a JPEG or PNG.",
      });
    }
  };

  const resetToDefault = () => {
    remove.mutate(undefined, {
      onSuccess: () => {
        const message = hasDestinationPhoto ? "Showing the destination photo again." : "Cover photo removed.";
        setAnnouncement(message);
        notify.success({ title: "Cover photo removed", description: message });
      },
      onError: (error) => notify.error({ title: "Cover photo not removed", description: error.message }),
    });
  };

  const busy = upload.isPending || remove.isPending;

  return (
    <>
      {remove.isPending ? (
        <span className="absolute inset-0 flex items-center justify-center bg-scrim/60" aria-hidden="true">
          <LoaderCircle className="size-6 animate-spin text-on-media motion-reduce:animate-none" />
        </span>
      ) : null}

      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={busy}
          aria-label="Edit cover photo"
          title="Edit cover photo"
          className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-card/80 text-foreground shadow-xs backdrop-blur-sm transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-60"
        >
          <Pencil className="size-3.5" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 p-1.5">
          <DropdownMenuItem className={menuItemClass} onClick={() => input.current?.click()}>
            <ImagePlus className="size-4 text-muted-foreground" aria-hidden="true" />
            {hasCustomCover ? "Replace photo" : "Upload a photo"}
          </DropdownMenuItem>
          {hasCustomCover ? (
            <DropdownMenuItem className={menuItemClass} onClick={resetToDefault}>
              <ImageOff className="size-4 text-muted-foreground" aria-hidden="true" />
              {hasDestinationPhoto ? "Use destination photo" : "Remove photo"}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={input}
        type="file"
        accept={ACCEPTED_TYPES}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          void open(file);
        }}
      />
      <span role="status" className="sr-only">{announcement}</span>

      <AvatarCropper
        key={picked?.url ?? "closed"}
        source={picked}
        aspect={BANNER_ASPECT}
        mask="frame"
        title="Position your trip cover"
        description="Drag the photo or use the arrow keys to move it. Zoom to choose what fills the banner."
        saveLabel="Save cover"
        savingLabel="Uploading cover…"
        progress={progress}
        saving={upload.isPending}
        error={upload.error?.message ?? null}
        onCancel={() => {
          upload.reset();
          closePicked();
        }}
        onSave={(crop) => {
          if (!picked) return;
          upload.mutate(
            { bitmap: picked.bitmap, crop },
            {
              onSuccess: () => {
                closePicked();
                setAnnouncement("Cover photo saved.");
                notify.success({ title: "Cover photo updated" });
              },
            },
          );
        }}
      />
    </>
  );
}

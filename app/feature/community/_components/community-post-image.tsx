"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";

import { cn } from "@/lib/utils";

type CommunityPostImageProps = {
  src: string;
  alt: string;
  /** Feed rows cap the height; the post page shows the picture at full size. */
  variant: "feed" | "detail";
  className?: string;
};

/**
 * A post picture letterboxed over a blurred copy of itself, so portrait and
 * landscape photos both fill the frame without cropping.
 */
export function CommunityPostImage({ src, alt, variant, className }: CommunityPostImageProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={`${alt} (picture unavailable)`}
        className={cn(
          "flex h-32 items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-well text-xs text-muted-foreground",
          className,
        )}
      >
        <ImageOff className="size-4" aria-hidden="true" />
        Picture unavailable
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border/60 bg-well",
        variant === "feed" ? "max-h-[32rem]" : "",
        // Hold space while the picture loads so the feed does not jump.
        !loaded && "min-h-64",
        className,
      )}
    >
      {/* Post pictures come from the authenticated media proxy, which the image optimizer cannot read. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="absolute inset-0 size-full scale-110 object-cover opacity-70 blur-2xl"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={cn(
          "relative mx-auto block w-auto object-contain",
          variant === "feed" ? "max-h-[32rem]" : "max-h-[80vh]",
        )}
      />
    </div>
  );
}

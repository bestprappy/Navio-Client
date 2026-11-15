"use client";

import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { ImageOff } from "lucide-react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

import { CommunityPostImage } from "./community-post-image";
import type { CommunityPost } from "./data";

const NO_IMAGES: readonly string[] = [];

/** A post's pictures in gallery order, falling back to the single cover from older responses. */
export function postImages(post: Pick<CommunityPost, "imageUrl" | "imageUrls">): readonly string[] {
  if (post.imageUrls?.length) return post.imageUrls;
  return post.imageUrl ? [post.imageUrl] : NO_IMAGES;
}

type GalleryVariant = "feed" | "detail";

type CommunityPostGalleryProps = {
  images: readonly string[];
  /** The post title; each slide is described as one of its pictures. */
  alt: string;
  variant: GalleryVariant;
  className?: string;
};

/** Slides share one frame so swiping between portrait and landscape never resizes the post. */
const FRAME_CLASS: Record<GalleryVariant, string> = {
  feed: "aspect-[4/3] max-h-[32rem]",
  detail: "aspect-[4/3] max-h-[80vh]",
};

const CONTROL_CLASS =
  "z-10 size-9 border-0 bg-scrim/70 text-on-media shadow-sm backdrop-blur-sm hover:bg-scrim/85 hover:text-on-media focus-visible:ring-3 focus-visible:ring-ring/60 disabled:opacity-30 dark:bg-scrim/70 dark:hover:bg-scrim/85";

/**
 * A post's pictures. One picture renders as a plain image; several become a
 * swipeable carousel with arrow buttons, position dots and keyboard support.
 */
export function CommunityPostGallery({ images, alt, variant, className }: CommunityPostGalleryProps) {
  if (images.length === 0) return null;
  if (images.length === 1) {
    return <CommunityPostImage src={images[0]} alt={alt} variant={variant} className={className} />;
  }
  return <PostGalleryCarousel images={images} alt={alt} variant={variant} className={className} />;
}

function PostGalleryCarousel({ images, alt, variant, className }: CommunityPostGalleryProps) {
  const [api, setApi] = useState<CarouselApi>();

  // Feed cards open the post on click; the gallery's own controls must not.
  const keepControlClicksLocal = useCallback((event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) event.stopPropagation();
  }, []);

  return (
    <Carousel
      setApi={setApi}
      opts={{ align: "start", containScroll: "trimSnaps" }}
      aria-label={`${alt}, ${images.length} pictures`}
      onClick={keepControlClicksLocal}
      className={cn("overflow-hidden rounded-xl border border-border/60 bg-well", className)}
    >
      <CarouselContent className="ml-0">
        {images.map((src, index) => (
          <CarouselItem
            key={src}
            aria-label={`Picture ${index + 1} of ${images.length}`}
            className={cn("relative pl-0", FRAME_CLASS[variant])}
          >
            <GallerySlide src={src} alt={`${alt}, picture ${index + 1} of ${images.length}`} eager={index === 0} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className={cn("left-3", CONTROL_CLASS)} aria-label="Previous picture" />
      <CarouselNext className={cn("right-3", CONTROL_CLASS)} aria-label="Next picture" />
      <GalleryDots api={api} count={images.length} />
    </Carousel>
  );
}

type GallerySlideProps = {
  src: string;
  alt: string;
  /** The first slide loads with the post; the rest wait until they are near. */
  eager: boolean;
};

/** One picture letterboxed over a blurred copy of itself, so nothing is cropped. */
function GallerySlide({ src, alt, eager }: GallerySlideProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={`${alt} (picture unavailable)`}
        className="flex size-full items-center justify-center gap-2 text-xs text-muted-foreground"
      >
        <ImageOff className="size-4" aria-hidden="true" />
        Picture unavailable
      </div>
    );
  }

  return (
    <>
      {/* Post pictures come from the authenticated media proxy, which the image optimizer cannot read. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        loading={eager ? "eager" : "lazy"}
        draggable={false}
        className="absolute inset-0 size-full scale-110 object-cover opacity-70 blur-2xl"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        draggable={false}
        onError={() => setFailed(true)}
        className="relative size-full select-none object-contain"
      />
    </>
  );
}

type GalleryDotsProps = {
  api: CarouselApi;
  count: number;
};

/** Position dots that also jump to a picture, plus a live announcement for screen readers. */
function GalleryDots({ api, count }: GalleryDotsProps) {
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!api) return;
    const sync = () => setSelected(api.selectedScrollSnap());
    sync();
    api.on("select", sync).on("reInit", sync);
    return () => {
      api.off("select", sync).off("reInit", sync);
    };
  }, [api]);

  return (
    <>
      <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center">
        <div className="flex items-center rounded-full bg-scrim/70 px-1.5 backdrop-blur-sm">
          {Array.from({ length: count }, (_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Show picture ${index + 1} of ${count}`}
              aria-current={index === selected ? "true" : undefined}
              onClick={() => api?.scrollTo(index)}
              className="group/dot flex h-6 items-center px-1 focus-visible:outline-none"
            >
              <span
                className={cn(
                  "block h-1.5 rounded-full bg-on-media transition-[width,opacity] duration-200 group-focus-visible/dot:ring-2 group-focus-visible/dot:ring-ring motion-reduce:transition-none",
                  index === selected ? "w-4 opacity-100" : "w-1.5 opacity-50 group-hover/dot:opacity-80",
                )}
              />
            </button>
          ))}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        Picture {selected + 1} of {count}
      </p>
    </>
  );
}

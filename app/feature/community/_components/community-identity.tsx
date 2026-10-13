"use client";

import { memo, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Every community gets one of six trail hues from its slug, so a community
 * without uploaded pictures still has a stable, recognizable identity.
 */
const TRAIL_TONES = [
  { fill: "bg-trail-1", stroke: "text-trail-1" },
  { fill: "bg-trail-2", stroke: "text-trail-2" },
  { fill: "bg-trail-3", stroke: "text-trail-3" },
  { fill: "bg-trail-4", stroke: "text-trail-4" },
  { fill: "bg-trail-5", stroke: "text-trail-5" },
  { fill: "bg-trail-6", stroke: "text-trail-6" },
] as const;

export function hashCommunitySeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function getTrailTone(seed: string) {
  return TRAIL_TONES[hashCommunitySeed(seed) % TRAIL_TONES.length];
}

/** "n/" mirrors the familiar r/ prefix and marks a community everywhere it appears. */
export function communityHandle(slug: string | undefined, name: string) {
  return `n/${slug ?? name}`;
}

const ICON_SIZES = {
  xs: "size-5 text-[0.625rem]",
  sm: "size-6 text-xs",
  md: "size-8 text-sm",
  lg: "size-10 text-base",
  xl: "size-20 text-3xl ring-4 ring-background sm:size-24",
} as const;

type CommunityIconProps = {
  name: string;
  seed: string;
  src?: string | null;
  size?: keyof typeof ICON_SIZES;
  className?: string;
};

/** Community avatar: the uploaded icon, or the first letter on the community's trail hue. */
export const CommunityIcon = memo(function CommunityIcon({
  name,
  seed,
  src,
  size = "md",
  className,
}: CommunityIconProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const tone = getTrailTone(seed);
  const showImage = Boolean(src) && failedSrc !== src;
  const initial = name.trim().match(/[\p{L}\p{N}]/u)?.[0]?.toUpperCase() ?? "N";

  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-extrabold text-white",
        ICON_SIZES[size],
        showImage ? "bg-muted" : tone.fill,
        className,
      )}
    >
      {showImage ? (
        // Community pictures come from the authenticated media proxy, which the image optimizer cannot read.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src ?? undefined}
          alt=""
          loading="lazy"
          onError={() => setFailedSrc(src ?? null)}
          className="size-full object-cover"
        />
      ) : (
        initial
      )}
    </span>
  );
});

/** Closed contour rings around a seeded summit, like a topographic map. */
function contourPaths(seed: number): string[] {
  const centerX = 620 + (seed % 260);
  const centerY = 40 + ((seed >> 8) % 140);
  const phase = ((seed >> 16) % 628) / 100;
  return Array.from({ length: 9 }, (_, ring) => {
    const radius = 46 + ring * 52;
    const points = Array.from({ length: 72 }, (_, step) => {
      const angle = (step / 72) * Math.PI * 2;
      const wobble =
        Math.sin(angle * 3 + phase) * (6 + ring * 3.2) +
        Math.sin(angle * 5 - phase * 1.7) * (3 + ring * 1.4);
      const r = radius + wobble;
      return `${(centerX + Math.cos(angle) * r * 1.55).toFixed(1)},${(centerY + Math.sin(angle) * r).toFixed(1)}`;
    });
    return `M${points.join("L")}Z`;
  });
}

type CommunityBannerProps = {
  seed: string;
  src?: string | null;
  alt: string;
  className?: string;
};

/** Uploaded banner, or a generated contour map tinted with the community's trail hue. */
export function CommunityBanner({ seed, src, alt, className }: CommunityBannerProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const tone = getTrailTone(seed);
  const paths = useMemo(() => contourPaths(hashCommunitySeed(seed)), [seed]);
  const showImage = Boolean(src) && failedSrc !== src;

  return (
    <div className={cn("relative overflow-hidden", tone.fill, className)}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src ?? undefined}
          alt={alt}
          onError={() => setFailedSrc(src ?? null)}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <svg
          aria-hidden="true"
          viewBox="0 0 1000 240"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 size-full"
        >
          <defs>
            <linearGradient id={`banner-shade-${seed}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="white" stopOpacity="0.16" />
              <stop offset="1" stopColor="black" stopOpacity="0.18" />
            </linearGradient>
          </defs>
          <rect width="1000" height="240" fill={`url(#banner-shade-${seed})`} />
          <g fill="none" stroke="white" strokeLinejoin="round">
            {paths.map((path, ring) => (
              <path
                key={ring}
                d={path}
                strokeWidth={ring % 4 === 0 ? 2.2 : 1.1}
                strokeOpacity={ring % 4 === 0 ? 0.42 : 0.24}
              />
            ))}
          </g>
        </svg>
      )}
    </div>
  );
}

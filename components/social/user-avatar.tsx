"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function initialsOf(name: string): string {
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

type UserAvatarProps = {
  name: string;
  src: string | null;
  size?: "sm" | "default" | "lg";
  className?: string;
};

/** Round avatar used in lists, comments and the navbar. Keyed so a removed photo shows initials again. */
export function UserAvatar({ name, src, size = "default", className }: UserAvatarProps) {
  return (
    <Avatar key={src ?? "none"} size={size} className={className}>
      {src ? <AvatarImage src={src} alt="" /> : null}
      <AvatarFallback>{initialsOf(name)}</AvatarFallback>
    </Avatar>
  );
}

type PassportPhotoProps = { name: string; src: string | null; className?: string };

/**
 * The square photo slot used on profile pages, matching the passport-style
 * card in settings. Plain img: the picture is served no-store through the
 * authenticated proxy, which the Next image optimiser cannot fetch.
 */
export function PassportPhoto({ name, src, className }: PassportPhotoProps) {
  return (
    <div className={cn("overflow-hidden rounded-[var(--card-radius-md)] bg-muted ring-4 ring-card", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={`Profile photo of ${name}`} className="size-full object-cover" />
      ) : (
        <span aria-hidden="true" className="flex size-full items-center justify-center text-3xl font-bold text-muted-foreground">
          {initialsOf(name)}
        </span>
      )}
    </div>
  );
}

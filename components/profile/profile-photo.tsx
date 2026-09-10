"use client";

import { useId } from "react";
import { Info } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ACCOUNT_STATUS_LABELS } from "./data";

type ProfilePhotoProps = {
  /** Avatar URL from the identity provider, when the session carries one. */
  imageUrl: string | null;
  displayName: string;
  status: string;
};

/**
 * Identity header: photo, name, and account status.
 *
 * The photo is read-only on purpose. `UserProfileResponse.avatarMediaId` points
 * at a media record, and Navio has no media upload endpoint yet, so there is
 * nowhere for a chosen file to go. Showing the provider's picture and saying
 * where to change it is accurate; a picker that only updated this browser
 * would not be.
 */
export function ProfilePhoto({ imageUrl, displayName, status }: ProfilePhotoProps) {
  const id = useId();
  const initials = getInitials(displayName);
  const statusKey = status.toLowerCase();
  const statusLabel = ACCOUNT_STATUS_LABELS[statusKey] ?? status;
  const isActive = statusKey === "active";

  return (
    <section
      aria-labelledby={`${id}-label`}
      className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6"
    >
      <Avatar className="size-20 shrink-0 sm:size-24">
        {imageUrl ? <AvatarImage src={imageUrl} alt="" /> : null}
        <AvatarFallback className="bg-primary/10 text-2xl font-semibold text-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h2 id={`${id}-label`} className="min-w-0 truncate text-base font-semibold text-foreground">
            {displayName || "Your profile"}
          </h2>
          <Badge variant={isActive ? "secondary" : "destructive"}>{statusLabel}</Badge>
        </div>
        <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          Your photo comes from the account you signed in with. Update it there and it
          appears here the next time you sign in.
        </p>
      </div>
    </section>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  const initials = parts.map((part) => Array.from(part)[0] ?? "").join("");
  return initials.toUpperCase() || "N";
}

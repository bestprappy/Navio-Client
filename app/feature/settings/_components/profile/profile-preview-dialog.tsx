"use client";

import { ProfileHeader } from "@/components/social/profile-header";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { PublicProfileFormInput, UserProfile } from "@/types/profile";

type ProfilePreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: UserProfile;
  /** Unsaved form values; the preview shows them as they would appear once saved. */
  draft: Partial<PublicProfileFormInput>;
};

/** Shows exactly what other travellers will see, including unsaved edits. */
export function ProfilePreviewDialog({ open, onOpenChange, profile, draft }: ProfilePreviewDialogProps) {
  const showPreferences = profile.showTravelPreferences;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] gap-4 overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Your public profile</DialogTitle>
          <DialogDescription>
            This is what signed-in travellers see. Your email, saved places, private plans and account details never appear here.
          </DialogDescription>
        </DialogHeader>
        <ProfileHeader
          profile={{
            displayName: draft.displayName?.trim() || profile.displayName,
            username: (draft.username ?? profile.username ?? "").replace(/^@/, "").toLowerCase() || null,
            bio: draft.bio ?? profile.bio,
            avatarUrl: profile.avatarMediaId ? `/api/users/me/picture?v=${profile.avatarMediaId}` : null,
            bannerUrl: profile.bannerMediaId ? `/api/users/${profile.id}/banner?v=${profile.bannerMediaId}` : null,
            travelInterests: showPreferences ? (draft.travelInterests ?? profile.travelInterests).filter((id): id is string => !!id) : [],
            travelPace: showPreferences ? (draft.travelPace ?? profile.travelPace) || null : null,
            memberSince: profile.createdAt,
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

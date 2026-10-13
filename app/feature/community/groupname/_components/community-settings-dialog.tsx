"use client";

import { useIsMutating } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { GroupDetail } from "../../_components/community-api";
import { CommunityAppearanceForm } from "./community-appearance-form";
import { CommunityProfileForm } from "./community-profile-form";
import { CommunityContentForm } from "./community-content-form";
import { CommunityMembersForm } from "./community-members-form";

const SECTIONS = [
  { id: "appearance", label: "Appearance" },
  { id: "profile", label: "Profile" },
  { id: "rules", label: "Rules" },
  { id: "flairs", label: "Flairs" },
  { id: "resources", label: "Resources" },
  { id: "moderators", label: "Moderators" },
] as const;

export type CommunitySettingsSection = (typeof SECTIONS)[number]["id"];

/** Controlled by the community header: `section` null means closed. */
export function CommunitySettingsDialog({
  group,
  section,
  onSectionChange,
}: {
  group: GroupDetail;
  section: CommunitySettingsSection | null;
  onSectionChange: (section: CommunitySettingsSection | null) => void;
}) {
  const pending =
    useIsMutating({ mutationKey: ["community", "settings", group.slug] }) > 0;
  return (
    <Dialog
      open={section !== null}
      onOpenChange={(next) => {
        if (!next && !pending) onSectionChange(null);
      }}
    >
      <DialogContent
        className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"
        showCloseButton={!pending}
      >
        <DialogHeader>
          <DialogTitle>Manage n/{group.slug}</DialogTitle>
          <DialogDescription>
            Change how your community looks, its guidelines, and who moderates it.
          </DialogDescription>
        </DialogHeader>
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label="Community settings sections"
        >
          {SECTIONS.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              aria-pressed={section === item.id}
              disabled={pending}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "rounded-full px-3",
                section === item.id && "bg-secondary text-secondary-foreground",
              )}
            >
              {item.label}
            </Button>
          ))}
        </div>
        {section === "appearance" ? (
          <CommunityAppearanceForm group={group} />
        ) : section === "profile" ? (
          <CommunityProfileForm group={group} />
        ) : section === "moderators" ? (
          <CommunityMembersForm group={group} />
        ) : section ? (
          <CommunityContentForm key={section} group={group} section={section} />
        ) : null}
        <DialogFooter>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => onSectionChange(null)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

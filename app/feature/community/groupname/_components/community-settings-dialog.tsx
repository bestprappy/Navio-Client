"use client";

import { useState } from "react";
import { useIsMutating } from "@tanstack/react-query";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { GroupDetail } from "../../_components/community-api";
import { CommunityProfileForm } from "./community-profile-form";
import { CommunityContentForm } from "./community-content-form";
import { CommunityMembersForm } from "./community-members-form";

const SECTIONS = [
  "profile",
  "rules",
  "flairs",
  "resources",
  "moderators",
] as const;

export function CommunitySettingsDialog({ group }: { group: GroupDetail }) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<(typeof SECTIONS)[number]>("profile");
  const pending =
    useIsMutating({ mutationKey: ["community", "settings", group.slug] }) > 0;
  if (!group.joined || (group.role !== "moderator" && group.role !== "admin"))
    return null;
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) setOpen(next);
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>
        <Settings className="size-4" aria-hidden="true" />
        Manage community
      </DialogTrigger>
      <DialogContent
        className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"
        showCloseButton={!pending}
      >
        <DialogHeader>
          <DialogTitle>Manage {group.name}</DialogTitle>
          <DialogDescription>
            Update your community profile, guidelines, and moderators.
          </DialogDescription>
        </DialogHeader>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Community settings sections"
        >
          {SECTIONS.map((item) => (
            <Button
              key={item}
              variant={section === item ? "secondary" : "outline"}
              size="sm"
              aria-pressed={section === item}
              disabled={pending}
              onClick={() => setSection(item)}
              className="capitalize"
            >
              {item}
            </Button>
          ))}
        </div>
        {section === "profile" ? (
          <CommunityProfileForm group={group} />
        ) : section === "moderators" ? (
          <CommunityMembersForm group={group} />
        ) : (
          <CommunityContentForm key={section} group={group} section={section} />
        )}
        <DialogFooter>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { SaveButton } from "@/app/feature/saved/save-button";
import { SharedLinkField } from "@/app/feature/planner/_components/share/shared-link-field";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function SharedPlanCardActions({ token }: { token: string }) {
  const [url, setUrl] = useState("");
  const [open, setOpen] = useState(false);

  return (
    <div role="group" aria-label="Plan actions" className="relative z-10 ml-auto flex shrink-0 items-center gap-2">
      <Dialog open={open} onOpenChange={(value) => {
        if (value) setUrl(new URL(`/share/plans/${encodeURIComponent(token)}`, window.location.origin).href);
        setOpen(value);
      }}>
        <DialogTrigger
          aria-label="Share plan"
          title="Share plan"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Share2 className="size-4" aria-hidden="true" />
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share this plan</DialogTitle>
            <DialogDescription>Send the published plan to someone planning their next trip.</DialogDescription>
          </DialogHeader>
          <SharedLinkField url={url} />
        </DialogContent>
      </Dialog>
      <SaveButton token={token} className="size-9" />
    </div>
  );
}

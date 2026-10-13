"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { formatDistanceToNow, isValid, parseISO } from "date-fns";
import { Check, CircleAlert, CloudUpload, EyeOff, Globe, Loader2, MoreHorizontal, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { GuideApiError, deleteGuide, guideKeys, setGuidePublished } from "../guides-api";
import { acceptSavedGuideAtom } from "../guides.atoms";
import { useGuideEditor } from "./guide-editor-context";
import type { GuideSaveStatus } from "./use-guide-autosave";
import type { Guide } from "../guide-model";

function edited(updatedAt: string, by: string | null): string {
  const date = parseISO(updatedAt);
  const when = isValid(date) ? formatDistanceToNow(date, { addSuffix: true }) : "recently";
  return by ? `Edited ${when} by ${by}` : `Edited ${when}`;
}

/** Where the text stands with the server, in words and an icon. */
export function SaveIndicator({ status, updatedAt, updatedByName }: { status: GuideSaveStatus; updatedAt: string; updatedByName: string | null }) {
  const view =
    status.kind === "saving" ? { icon: <Loader2 className="size-3.5 animate-spin" />, text: "Saving…" }
    : status.kind === "pending" ? { icon: <CloudUpload className="size-3.5" />, text: "Unsaved changes" }
    : status.kind === "saved" ? { icon: <Check className="size-3.5" />, text: edited(updatedAt, updatedByName) }
    : { icon: <CircleAlert className="size-3.5 text-destructive" />, text: "Not saved" };
  return (
    <p role="status" aria-live="polite" className={cn("flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground", status.kind === "error" && "text-destructive")}>
      <span aria-hidden="true" className="shrink-0">{view.icon}</span>
      <span className="truncate">{view.text}</span>
    </p>
  );
}

type GuideActionsProps = {
  status: GuideSaveStatus;
  /** Saves pending edits first, so an action applies to the latest version. */
  flush: () => Promise<Guide | null>;
};

/** Publish or unpublish the guide, and delete it. Every admin can do all three. */
export function GuideActions({ status, flush }: GuideActionsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { guide } = useGuideEditor("GuideActions");
  const acceptSaved = useSetAtom(acceptSavedGuideAtom);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const blocked = status.kind === "conflict" || status.kind === "gone";
  const published = guide.status === "PUBLISHED";

  const publication = useMutation({
    mutationFn: async (publish: boolean) => {
      const latest = await flush();
      if (!latest) throw new GuideApiError("Save the guide before changing whether travelers see it.", 0, "invalid");
      return setGuidePublished(latest, publish);
    },
    onSuccess: (saved) => {
      acceptSaved(saved);
      void queryClient.invalidateQueries({ queryKey: guideKeys.all });
      void queryClient.invalidateQueries({ queryKey: guideKeys.published });
    },
    onError: (error) => console.error("Changing a guide's publication failed.", { component: "GuideActions", guideId: guide.id, error }),
  });

  const removal = useMutation({
    mutationFn: async () => {
      const latest = await flush();
      if (!latest) throw new GuideApiError("Save or reload the guide before deleting it.", 0, "invalid");
      return deleteGuide(latest);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: guideKeys.all });
      void queryClient.invalidateQueries({ queryKey: guideKeys.published });
      router.push("/admin/guides");
    },
    onError: (error) => console.error("Deleting a guide failed.", { component: "GuideActions", guideId: guide.id, error }),
  });

  const publicationError = publication.error instanceof GuideApiError ? publication.error.message : publication.error ? "The guide's publication could not change. Try again." : null;
  const deleteError = removal.error instanceof GuideApiError ? removal.error.message : removal.error ? "The guide could not be deleted. Try again." : null;

  return (
    <>
      <Badge variant={published ? "default" : "secondary"} className="shrink-0">
        {published ? <Globe aria-hidden="true" /> : null}
        {published ? "Published" : "Draft"}
      </Badge>
      {published ? null : (
        <Button type="button" size="sm" disabled={blocked || publication.isPending || removal.isPending} onClick={() => publication.mutate(true)}>
          {publication.isPending ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Globe aria-hidden="true" />}
          Publish
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button type="button" variant="ghost" size="icon-sm" aria-label="More guide actions" />}>
          <MoreHorizontal aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {published ? (
            <DropdownMenuItem disabled={blocked || publication.isPending} onClick={() => publication.mutate(false)}>
              <EyeOff aria-hidden="true" />
              Unpublish
            </DropdownMenuItem>
          ) : null}
          {published ? <DropdownMenuSeparator /> : null}
          <DropdownMenuItem variant="destructive" disabled={blocked || publication.isPending} onClick={() => setConfirmDelete(true)}>
            <Trash2 aria-hidden="true" />
            Delete guide
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {publicationError ? (
        <p role="alert" className="absolute inset-x-3 top-full mt-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive sm:inset-x-auto sm:right-4">
          {publicationError}
        </p>
      ) : null}

      <Dialog open={confirmDelete} onOpenChange={(open) => !removal.isPending && setConfirmDelete(open)}>
        <DialogContent showCloseButton={false} initialFocus={cancelRef}>
          <DialogHeader>
            <DialogTitle>Delete the {guide.name || "untitled"} guide?</DialogTitle>
            <DialogDescription>
              It is removed for every admin{published ? ", and travelers stop seeing it in the planner" : ""}. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteError ? (
            <p role="alert" className="text-sm text-destructive">
              {deleteError}
            </p>
          ) : null}
          <DialogFooter>
            <Button ref={cancelRef} type="button" variant="outline" disabled={removal.isPending} onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={removal.isPending} onClick={() => removal.mutate()}>
              {removal.isPending ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Trash2 aria-hidden="true" />}
              {removal.isPending ? "Deleting…" : "Delete guide"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

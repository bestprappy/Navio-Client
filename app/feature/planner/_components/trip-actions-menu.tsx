"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MoreHorizontal, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { useDeleteTrip } from "./use-delete-trip";

type TripActionsMenuProps = {
  tripId: string;
  tripTitle: string;
  /** Where to go once the trip is gone; omit when the list the trip lives in simply refreshes. */
  redirectTo?: string;
  className?: string;
};

export function TripActionsMenu({ tripId, tripTitle, redirectTo, className }: TripActionsMenuProps) {
  const router = useRouter();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const deleteMutation = useDeleteTrip(tripId);
  const isDeleting = deleteMutation.isPending;

  function handleConfirmDelete() {
    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        setIsConfirmOpen(false);
        if (redirectTo) router.replace(redirectTo);
      },
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("shrink-0 rounded-full text-muted-foreground hover:text-foreground", className)}
              aria-label={`Trip options for ${tripTitle}`}
              title="Trip options"
            />
          }
        >
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              deleteMutation.reset();
              setIsConfirmOpen(true);
            }}
          >
            <Trash2 aria-hidden="true" />
            Delete trip
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={isConfirmOpen}
        onOpenChange={(open) => {
          if (!isDeleting) setIsConfirmOpen(open);
        }}
      >
        <DialogContent showCloseButton={false} initialFocus={cancelButtonRef}>
          <DialogHeader>
            <DialogTitle>Delete this trip?</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{tripTitle}</span> and its itinerary, saved places,
              checklist, and budget will be permanently deleted. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteMutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              The trip could not be deleted. Please try again.
            </p>
          )}
          <DialogFooter>
            <Button
              ref={cancelButtonRef}
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => setIsConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={isDeleting} onClick={handleConfirmDelete}>
              {isDeleting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="size-4" aria-hidden="true" />
              )}
              {isDeleting ? "Deleting…" : "Delete trip"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

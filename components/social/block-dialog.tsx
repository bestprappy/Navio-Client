"use client";

import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRelationshipActions } from "@/hooks/use-social";

type BlockDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  name: string;
  /** True to confirm unblocking instead. */
  unblock?: boolean;
};

/** Confirms a block (or unblock) and spells out exactly what it changes. */
export function BlockDialog({ open, onOpenChange, accountId, name, unblock = false }: BlockDialogProps) {
  const { block } = useRelationshipActions(accountId);

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!block.isPending) onOpenChange(next); }}>
      <DialogContent className="gap-5 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{unblock ? `Unblock ${name}?` : `Block ${name}?`}</DialogTitle>
          <DialogDescription>
            {unblock
              ? "You'll see each other's posts again and can follow each other. Earlier follows are not restored."
              : "You'll stop following each other. Neither of you will see the other's posts or be able to comment, vote or get notifications from each other. They aren't told you blocked them."}
          </DialogDescription>
        </DialogHeader>
        {block.error ? <p role="alert" className="text-sm text-destructive">{block.error.message}</p> : null}
        <DialogFooter>
          <Button type="button" variant="outline" className="h-10 px-5" disabled={block.isPending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={unblock ? "default" : "destructive"}
            className="h-10 px-5"
            disabled={block.isPending}
            onClick={() => block.mutate(!unblock, { onSuccess: () => onOpenChange(false) })}
          >
            {block.isPending ? <LoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : null}
            {unblock ? "Unblock" : "Block"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

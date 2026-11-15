"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { catalogKeys, transitionCatalogEntry } from "./catalog-api";
import type { CatalogTransition } from "./catalog-vehicle-row";

type CatalogTransitionDialogProps = {
  transition: CatalogTransition | null;
  onClose: () => void;
  onDone: (message: string) => void;
};

/** Confirms publishing or archiving a vehicle straight from the catalog list. */
export function CatalogTransitionDialog({ transition, onClose, onDone }: CatalogTransitionDialogProps) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (value: CatalogTransition) => transitionCatalogEntry(value.entry, value.action),
    retry: false,
    onSuccess: async (saved, value) => {
      const name = `${saved.specification.make} ${saved.specification.model}`;
      onDone(value.action === "publish" ? `${name} published.` : `${name} archived.`);
      onClose();
      await Promise.all([queryClient.invalidateQueries({ queryKey: catalogKeys.root }), queryClient.invalidateQueries({ queryKey: catalogKeys.public })]);
    },
  });
  const publishing = transition?.action === "publish";
  const name = transition ? `${transition.entry.specification.make} ${transition.entry.specification.model}` : "";

  return (
    <Dialog open={transition !== null} onOpenChange={(open) => { if (!open && !mutation.isPending) { mutation.reset(); onClose(); } }}>
      <DialogContent showCloseButton={!mutation.isPending}>
        <DialogHeader>
          <DialogTitle>{publishing ? `Publish ${name}?` : `Archive ${name}?`}</DialogTitle>
          <DialogDescription>
            {publishing
              ? "Drivers will be able to select this vehicle. Its specifications must have a dated source."
              : "This removes the vehicle from new selections. Existing garages and trips keep their saved specifications."}
          </DialogDescription>
        </DialogHeader>
        {mutation.isError && <p role="alert" className="text-sm text-destructive">{mutation.error.message}</p>}
        <DialogFooter>
          <Button variant="outline" disabled={mutation.isPending} onClick={() => { mutation.reset(); onClose(); }}>Cancel</Button>
          <Button variant={publishing ? "default" : "destructive"} disabled={mutation.isPending || !transition}
            onClick={() => { if (transition) mutation.mutate(transition); }}>
            {mutation.isPending ? "Updating…" : publishing ? "Publish vehicle" : "Archive vehicle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

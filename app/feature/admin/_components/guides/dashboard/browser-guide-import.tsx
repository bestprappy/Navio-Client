"use client";

import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { createGuide, GuideApiError, guideKeys, type GuideSummary } from "../guides-api";
import { readBrowserGuides } from "../guide-storage";
import { useIsClient } from "@/hooks/use-is-client";

/** Move pre-backend guides into the shared library without replacing anyone's guide. */
export function BrowserGuideImport({ guides }: { guides: readonly GuideSummary[] }) {
  const isClient = useIsClient();
  const local = useMemo(() => isClient ? readBrowserGuides() : [], [isClient]);
  const queryClient = useQueryClient();
  const missing = local.filter((guide) => !guides.some((saved) => saved.destinationProvider === guide.destination.provider && saved.destinationPlaceId === guide.destination.providerPlaceId));
  const migration = useMutation({
    mutationFn: async () => {
      for (const guide of missing) {
        try { await createGuide(guide); }
        catch (error) { if (!(error instanceof GuideApiError && error.kind === "conflict")) throw error; }
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: guideKeys.list }),
  });
  if (!missing.length) return null;
  return <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-4">
    <p className="min-w-0 flex-1 text-sm">{missing.length} {missing.length === 1 ? "guide was" : "guides were"} saved in this browser before sharing was available. Import them so every admin can edit them.</p>
    <Button variant="outline" disabled={migration.isPending} onClick={() => migration.mutate()}>{migration.isPending ? "Importing…" : "Import browser guides"}</Button>
    {migration.error ? <p role="alert" className="w-full text-sm text-destructive">{migration.error.message}</p> : null}
  </div>;
}

"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { AdminApiError } from "../admin-api";
import { AdminErrorState, AdminLoadingRows } from "../admin-query-state";
import { AddColorForm } from "./add-color-form";
import {
  MAX_ACTIVE_COLORS,
  addPaletteColor,
  listAdminPalette,
  paletteAdminKeys,
  paletteCacheKeys,
  restorePaletteColor,
  retirePaletteColor,
  type AdminPaletteColor,
  type NewColor,
} from "./palette-api";
import { PaletteColorTile } from "./palette-color-tile";

type Notice = { tone: "status" | "error"; message: string; undoId?: string };

/** Add colors, remove them from pickers and bring them back. Nothing is deleted. */
export function PaletteWorkspace() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: paletteAdminKeys.root, queryFn: listAdminPalette, staleTime: 0, retry: false });
  const [notice, setNotice] = useState<Notice | null>(null);

  async function refresh() {
    await Promise.all(paletteCacheKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
  }
  function fail(error: unknown, operation: string) {
    console.error(`[PaletteWorkspace] ${operation} failed`, error);
    setNotice({ tone: "error", message: error instanceof AdminApiError ? error.message : "Something went wrong. Reload the palette and try again." });
  }

  const add = useMutation({
    mutationFn: addPaletteColor,
    onSuccess: async (color) => { setNotice({ tone: "status", message: `Added ${color.name}.` }); await refresh(); },
    onError: (error) => fail(error, "add color"),
  });
  const retire = useMutation({
    mutationFn: (color: AdminPaletteColor) => retirePaletteColor(color.id),
    onSuccess: async (color) => {
      setNotice({ tone: "status", message: `Removed ${color.name}. Trips and guides that use it keep it.`, undoId: color.id });
      await refresh();
    },
    onError: (error) => fail(error, "remove color"),
  });
  const restore = useMutation({
    mutationFn: (id: string) => restorePaletteColor(id),
    onSuccess: async (color) => { setNotice({ tone: "status", message: `${color.name} is back in the palette.` }); await refresh(); },
    onError: (error) => fail(error, "restore color"),
  });
  const busy = add.isPending || retire.isPending || restore.isPending;

  if (query.isPending) return <AdminLoadingRows rows={6} label="Loading palette" />;
  if (query.isError) return <AdminErrorState error={query.error} onRetry={() => query.refetch()} isRetrying={query.isFetching} />;

  const active = query.data.filter((color) => !color.retired);
  const retired = query.data.filter((color) => color.retired);
  const full = active.length >= MAX_ACTIVE_COLORS;

  return (
    <div className="flex flex-col gap-8">
      <div aria-live="polite" className="min-h-0">
        {notice ? (
          <div
            role={notice.tone === "error" ? "alert" : "status"}
            className={notice.tone === "error"
              ? "flex flex-wrap items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm"
              : "flex flex-wrap items-center gap-3 rounded-lg border bg-muted/40 p-3 text-sm"}
          >
            <p className="flex-1">{notice.message}</p>
            {notice.undoId ? (
              <Button variant="outline" size="sm" disabled={busy} onClick={() => notice.undoId && restore.mutate(notice.undoId)}>
                <RotateCcw aria-hidden="true" />
                Undo
              </Button>
            ) : null}
            <Button variant="ghost" size="icon-sm" aria-label="Dismiss message" onClick={() => setNotice(null)}>
              <X aria-hidden="true" />
            </Button>
          </div>
        ) : null}
      </div>

      <AddColorForm
        existing={query.data}
        disabled={full}
        disabledReason={full ? `The palette already offers ${MAX_ACTIVE_COLORS} colors. Remove one to add another.` : undefined}
        isSaving={add.isPending}
        onAdd={async (color: NewColor) => { await add.mutateAsync(color); }}
      />

      <section aria-labelledby="active-colors-heading" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="active-colors-heading" className="text-lg font-semibold">In the palette</h2>
          <p className="text-sm text-muted-foreground">{active.length} of {MAX_ACTIVE_COLORS} colors · shown in this order in pickers</p>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((color) => (
            <PaletteColorTile
              key={color.id}
              name={color.name}
              hex={color.hex}
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy || active.length <= 1}
                  aria-label={`Remove ${color.name} from the palette`}
                  onClick={() => retire.mutate(color)}
                >
                  Remove
                </Button>
              }
            />
          ))}
        </ul>
        {active.length <= 1 ? <p className="text-sm text-muted-foreground">Keep at least one color so pickers always have a choice.</p> : null}
      </section>

      {retired.length > 0 ? (
        <section aria-labelledby="retired-colors-heading" className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 id="retired-colors-heading" className="text-lg font-semibold">Removed</h2>
            <p className="text-sm text-muted-foreground">Hidden from pickers. Trips, guides and shared plans that already use them still show them.</p>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {retired.map((color) => (
              <PaletteColorTile
                key={color.id}
                name={color.name}
                hex={color.hex}
                muted
                action={
                  <Button variant="outline" size="sm" disabled={busy || full} aria-label={`Restore ${color.name}`} onClick={() => restore.mutate(color.id)}>
                    Restore
                  </Button>
                }
              />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

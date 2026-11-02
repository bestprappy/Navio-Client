"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";

import { notify } from "@/components/toast/notify";
import { Button } from "@/components/ui/button";
import { DEFAULT_PALETTE_COLOR_ID } from "@/lib/palette/palette-colors";

import { AdminApiError } from "../admin-api";
import { AdminErrorState, AdminLoadingRows } from "../admin-query-state";
import { AddColorForm } from "./add-color-form";
import { DeleteColorDialog } from "./delete-color-dialog";
import { EditLabelTextDialog } from "./edit-label-text-dialog";
import {
  MAX_ACTIVE_COLORS,
  addPaletteColor,
  deletePaletteColor,
  listAdminPalette,
  paletteAdminKeys,
  paletteCacheKeys,
  restorePaletteColor,
  retirePaletteColor,
  updatePaletteTextColors,
  type AdminPaletteColor,
  type NewColor,
  type TextColors,
} from "./palette-api";
import { PaletteColorTile } from "./palette-color-tile";

/** Long enough to reach Undo after removing a color by mistake. */
const UNDO_DURATION_MS = 10_000;

/** Add colors, set their label text, remove them from pickers, bring them back or delete them for good. */
export function PaletteWorkspace() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: paletteAdminKeys.root, queryFn: listAdminPalette, staleTime: 0, retry: false });
  const [editing, setEditing] = useState<AdminPaletteColor | null>(null);
  const [deleting, setDeleting] = useState<AdminPaletteColor | null>(null);

  async function refresh() {
    await Promise.all(paletteCacheKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
  }
  function fail(error: unknown, title: string) {
    console.error(`[PaletteWorkspace] ${title}`, error);
    notify.error({ title, description: error instanceof AdminApiError ? error.message : "Reload the palette and try again." });
  }

  const add = useMutation({
    mutationFn: addPaletteColor,
    onSuccess: async (color) => { notify.success({ title: `Added ${color.name}` }); await refresh(); },
    onError: (error) => fail(error, "Color not added"),
  });
  const updateText = useMutation({
    mutationFn: ({ color, colors }: { color: AdminPaletteColor; colors: TextColors }) => updatePaletteTextColors(color.id, colors),
    onSuccess: async (color) => {
      setEditing(null);
      notify.success({ title: `Saved label text for ${color.name}` });
      await refresh();
    },
    onError: (error) => { setEditing(null); fail(error, "Label text not saved"); },
  });
  const retire = useMutation({
    mutationFn: (color: AdminPaletteColor) => retirePaletteColor(color.id),
    onSuccess: async (color) => {
      notify.success({
        title: `Removed ${color.name}`,
        description: "Trips and guides that use it keep it.",
        action: { label: "Undo", onClick: () => restore.mutate(color.id) },
        duration: UNDO_DURATION_MS,
      });
      await refresh();
    },
    onError: (error) => fail(error, "Color not removed"),
  });
  const restore = useMutation({
    mutationFn: (id: string) => restorePaletteColor(id),
    onSuccess: async (color) => { notify.success({ title: `${color.name} is back in the palette` }); await refresh(); },
    onError: (error) => fail(error, "Color not restored"),
  });
  const remove = useMutation({
    mutationFn: async (color: AdminPaletteColor) => { await deletePaletteColor(color.id); return color; },
    onSuccess: async (color) => {
      setDeleting(null);
      notify.success({ title: `Deleted ${color.name}`, description: "Everything that used it now shows the default color." });
      await refresh();
    },
    onError: (error) => { setDeleting(null); fail(error, "Color not deleted"); },
  });
  const busy = add.isPending || updateText.isPending || retire.isPending || restore.isPending || remove.isPending;

  if (query.isPending) return <AdminLoadingRows rows={6} label="Loading palette" />;
  if (query.isError) return <AdminErrorState error={query.error} onRetry={() => query.refetch()} isRetrying={query.isFetching} />;

  const active = query.data.filter((color) => !color.retired);
  const retired = query.data.filter((color) => color.retired);
  const full = active.length >= MAX_ACTIVE_COLORS;
  const defaultColorName = query.data.find((color) => color.id === DEFAULT_PALETTE_COLOR_ID)?.name ?? "Teal";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="w-full lg:sticky lg:top-6 lg:w-[22rem] lg:shrink-0">
          <AddColorForm
            existing={query.data}
            disabled={full}
            disabledReason={full ? `The palette already offers ${MAX_ACTIVE_COLORS} colors. Remove one to add another.` : undefined}
            isSaving={add.isPending}
            onAdd={async (color: NewColor) => { await add.mutateAsync(color); }}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-8">
          <section aria-labelledby="active-colors-heading" className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="active-colors-heading" className="text-lg font-semibold">In the palette</h2>
              <p className="text-sm text-muted-foreground">{active.length} of {MAX_ACTIVE_COLORS}, in picker order</p>
            </div>
            <ul className="grid gap-2 xl:grid-cols-2">
              {active.map((color) => (
                <PaletteColorTile
                  key={color.id}
                  name={color.name}
                  hex={color.hex}
                  textOnLight={color.textOnLight}
                  textOnDark={color.textOnDark}
                  actions={
                    <>
                      <Button variant="ghost" size="sm" disabled={busy} aria-label={`Edit label text on ${color.name}`} onClick={() => setEditing(color)}>
                        Label text
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy || active.length <= 1}
                        aria-label={`Remove ${color.name} from the palette`}
                        onClick={() => retire.mutate(color)}
                      >
                        Remove
                      </Button>
                    </>
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
                <p className="text-sm text-muted-foreground">
                  Hidden from pickers. Trips, guides and shared plans that already use them still show them until you delete the color.
                </p>
              </div>
              <ul className="grid gap-2 xl:grid-cols-2">
                {retired.map((color) => (
                  <PaletteColorTile
                    key={color.id}
                    name={color.name}
                    hex={color.hex}
                    textOnLight={color.textOnLight}
                    textOnDark={color.textOnDark}
                    muted
                    actions={
                      <>
                        <Button variant="outline" size="sm" disabled={busy || full} aria-label={`Restore ${color.name}`} onClick={() => restore.mutate(color.id)}>
                          Restore
                        </Button>
                        {color.id === DEFAULT_PALETTE_COLOR_ID ? null : (
                          <Button variant="destructive" size="icon-sm" disabled={busy} aria-label={`Delete ${color.name} permanently`} onClick={() => setDeleting(color)}>
                            <Trash2 aria-hidden="true" />
                          </Button>
                        )}
                      </>
                    }
                  />
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>

      <EditLabelTextDialog
        color={editing}
        isSaving={updateText.isPending}
        onOpenChange={(open) => { if (!open && !updateText.isPending) setEditing(null); }}
        onSave={(color, colors) => updateText.mutate({ color, colors })}
      />
      <DeleteColorDialog
        color={deleting}
        defaultColorName={defaultColorName}
        isDeleting={remove.isPending}
        onOpenChange={(open) => { if (!open && !remove.isPending) setDeleting(null); }}
        onConfirm={(color) => remove.mutate(color)}
      />
    </div>
  );
}

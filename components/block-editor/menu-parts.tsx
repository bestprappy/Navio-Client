"use client";

import { useEffect, type ReactNode, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronRight, type LucideIcon } from "lucide-react";
import type { Placement, ReferenceElement } from "@floating-ui/dom";

import { cn } from "@/lib/utils";

import styles from "./block-editor.module.css";
import { useFloatingPanel } from "./use-floating-panel";
import type { NoteColor } from "./note-document";

/** Every floating part of the editor carries this, so a click in one never dismisses another. */
export const FLOATING_ATTRIBUTE = "data-note-floating";

type FloatingSurfaceProps = {
  open: boolean;
  reference: ReferenceElement | null;
  placement?: Placement;
  gap?: number;
  maxHeight?: number;
  /** Called on a pointer press outside every editor menu. */
  onDismiss?: () => void;
  className?: string;
  children: ReactNode;
};

export function FloatingSurface({ open, reference, placement, gap, maxHeight, onDismiss, className, children }: FloatingSurfaceProps) {
  const { setFloating, style } = useFloatingPanel({ open, reference, placement, gap, maxHeight });

  useEffect(() => {
    if (!open || !onDismiss) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest(`[${FLOATING_ATTRIBUTE}]`)) return;
      onDismiss();
    };
    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [open, onDismiss]);

  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div
      ref={setFloating}
      style={style}
      data-note-floating=""
      data-entering="true"
      className={cn(styles.surface, "z-50 flex flex-col", className)}
    >
      {children}
    </div>,
    document.body,
  );
}

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd className={cn("font-mono text-xs leading-none tracking-tight text-muted-foreground/80", className)}>{children}</kbd>
  );
}

export function MenuSeparator() {
  return <div role="separator" className="-mx-1 my-1 h-px bg-border" />;
}

export function MenuSectionLabel({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <div id={id} role="presentation" className="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground">
      {children}
    </div>
  );
}

type MenuOptionProps = {
  id: string;
  active: boolean;
  label: string;
  icon?: LucideIcon;
  /** A coloured "A" in place of the icon. */
  swatch?: { color: NoteColor | null; kind: "text" | "background" };
  /** Shows the icon on a raised tile, as the slash menu does. */
  tile?: boolean;
  hint?: ReactNode;
  checked?: boolean;
  hasSubmenu?: boolean;
  disabled?: boolean;
  destructive?: boolean;
  onActivate: () => void;
  onSelect: () => void;
  rowRef?: (element: HTMLDivElement | null) => void;
};

/**
 * One row of a listbox whose focus stays in an input or the editor; the row is
 * announced through aria-activedescendant, so it is never focused itself.
 */
export function MenuOption({
  id,
  active,
  label,
  icon: Icon,
  swatch,
  tile = false,
  hint,
  checked,
  hasSubmenu = false,
  disabled = false,
  destructive = false,
  onActivate,
  onSelect,
  rowRef,
}: MenuOptionProps) {
  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch" && !active) onActivate();
  };

  return (
    <div
      id={id}
      ref={rowRef}
      role="option"
      aria-selected={active}
      aria-disabled={disabled || undefined}
      onPointerMove={handlePointerMove}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => {
        if (!disabled) onSelect();
      }}
      className={cn(
        "flex min-h-8 cursor-pointer items-center gap-2.5 rounded-sm px-2 py-1 text-sm select-none",
        active && !destructive && "bg-muted",
        active && destructive && "bg-destructive/10 text-destructive",
        disabled && "cursor-default opacity-45",
      )}
    >
      {swatch ? (
        <ColorSwatch color={swatch.color} kind={swatch.kind} />
      ) : Icon ? (
        tile ? (
          <span className={styles.blockTile}>
            <Icon className="size-4" aria-hidden="true" />
          </span>
        ) : (
          <Icon className={cn("size-4 shrink-0", destructive && active ? "text-destructive" : "text-muted-foreground")} aria-hidden="true" />
        )
      ) : null}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {hint ? <span className="shrink-0">{hint}</span> : null}
      {checked ? <Check className="size-4 shrink-0 text-primary" aria-hidden="true" /> : null}
      {hasSubmenu ? <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /> : null}
    </div>
  );
}

export function ColorSwatch({ color, kind, className }: { color: NoteColor | null; kind: "text" | "background"; className?: string }) {
  const ink = color ? `var(--note-${color})` : "var(--foreground)";
  return (
    <span
      aria-hidden="true"
      className={cn(styles.swatch, className)}
      style={
        kind === "text"
          ? { color: ink }
          : { background: color ? `color-mix(in oklch, ${ink} var(--note-tint), transparent)` : "transparent" }
      }
    >
      {kind === "text" ? "A" : ""}
    </span>
  );
}

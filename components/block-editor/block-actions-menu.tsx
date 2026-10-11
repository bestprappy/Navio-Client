"use client";

import { Fragment, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Copy, Palette, Repeat2, Trash2, type LucideIcon } from "lucide-react";

import {
  deleteBlock,
  duplicateBlock,
  findBlockAt,
  findBlockFromSelection,
  focusBlock,
  getBlockColor,
  getBlockTypeId,
  moveBlock,
  setBlockColor,
  turnBlockInto,
  type BlockTarget,
  type ColorKind,
} from "./block-commands";
import { useBlockEditorContext, type BlockMenuRequest } from "./block-editor-context";
import { CONVERTIBLE_BLOCK_TYPES, getBlockType, type BlockTypeId } from "./block-types";
import { FloatingSurface, Kbd, MenuOption, MenuSectionLabel, MenuSeparator } from "./menu-parts";
import { NOTE_COLORS, NOTE_COLOR_LABELS, type NoteColor } from "./note-document";
import { SHORTCUTS, formatShortcut } from "./shortcuts";

type SubmenuKind = "turnInto" | "color";

type Entry = {
  id: string;
  label: string;
  icon?: LucideIcon;
  swatch?: { color: NoteColor | null; kind: ColorKind };
  hint?: ReactNode;
  checked?: boolean;
  submenu?: SubmenuKind;
  disabled?: boolean;
  destructive?: boolean;
  separatorBefore?: boolean;
  section?: string;
  run?: () => void;
};

type SubmenuState = { kind: SubmenuKind; active: number; focused: boolean };

/** Block actions: what the gutter handle, the toolbar's ⋯ button and Ctrl+/ open. */
export function BlockActionsMenu() {
  const { blockMenu, viewReady } = useBlockEditorContext("BlockActionsMenu");
  if (!blockMenu || !viewReady) return null;
  return <BlockActionsPanel key={blockMenu.pos} request={blockMenu} />;
}

function firstEnabled(entries: readonly Entry[], from: number, step: 1 | -1): number {
  if (!entries.length) return 0;
  for (let offset = 0; offset < entries.length; offset += 1) {
    const index = (from + offset * step + entries.length * 2) % entries.length;
    if (!entries[index].disabled) return index;
  }
  return from;
}

function matches(entry: Entry, needle: string): boolean {
  return entry.label.toLowerCase().includes(needle);
}

function contextHint(text: string) {
  return <span className="text-xs text-muted-foreground">{text}</span>;
}

function BlockActionsPanel({ request }: { request: BlockMenuRequest }) {
  const { editor, closeBlockMenu } = useBlockEditorContext("BlockActionsMenu");
  const inputRef = useRef<HTMLInputElement>(null);
  const rowRefs = useRef(new Map<string, HTMLDivElement>());
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [submenu, setSubmenu] = useState<SubmenuState | null>(null);
  const listboxId = useId();
  const submenuId = useId();

  const target: BlockTarget | null = findBlockAt(editor.state.doc, request.pos);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  const entries = useMemo(() => {
    if (!target) return { main: [] as Entry[], turnInto: [] as Entry[], color: [] as Entry[] };

    const fresh = () => findBlockAt(editor.state.doc, request.pos);
    const refocus = () => {
      const moved = findBlockFromSelection(editor.state);
      if (moved) focusBlock(editor, moved);
      else editor.view.focus();
    };
    const finish = (action: (block: BlockTarget) => void) => () => {
      closeBlockMenu(false);
      const block = fresh();
      if (block) action(block);
    };

    const currentType = getBlockTypeId(target);
    const hasText = target.node.textContent.trim().length > 0 && target.node.type.name !== "codeBlock";
    const textColor = getBlockColor(target, "text");
    const backgroundColor = getBlockColor(target, "background");

    const turnInto: Entry[] = CONVERTIBLE_BLOCK_TYPES.map((type) => ({
      id: `turn-${type.id}`,
      label: type.label,
      icon: type.icon,
      checked: type.id === currentType,
      run: finish((block) => {
        if (!turnBlockInto(editor, block, type.id as BlockTypeId)) focusBlock(editor, block);
      }),
    }));

    const colorEntries = (kind: ColorKind, current: NoteColor | null): Entry[] =>
      [null, ...NOTE_COLORS].map((color, index) => ({
        id: `${kind}-${color ?? "default"}`,
        label: kind === "text" ? (color ? NOTE_COLOR_LABELS[color] : "Default") : `${color ? NOTE_COLOR_LABELS[color] : "Default"} background`,
        swatch: { color, kind },
        checked: current === color,
        section: index === 0 ? (kind === "text" ? "Text" : "Background") : undefined,
        run: finish((block) => {
          setBlockColor(editor, block, kind, color);
          refocus();
        }),
      }));

    const main: Entry[] = [
      { id: "turnInto", label: "Turn into", icon: Repeat2, submenu: "turnInto", disabled: currentType === "divider" },
      { id: "color", label: "Color", icon: Palette, submenu: "color", disabled: !hasText },
      {
        id: "duplicate",
        label: "Duplicate",
        icon: Copy,
        hint: <Kbd>{formatShortcut(SHORTCUTS.duplicate)}</Kbd>,
        separatorBefore: true,
        run: finish((block) => {
          if (duplicateBlock(editor, block)) refocus();
        }),
      },
      {
        id: "moveUp",
        label: "Move up",
        icon: ArrowUp,
        hint: <Kbd>{formatShortcut(SHORTCUTS.moveUp)}</Kbd>,
        disabled: target.index === 0,
        run: finish((block) => {
          if (moveBlock(editor, block, -1)) refocus();
        }),
      },
      {
        id: "moveDown",
        label: "Move down",
        icon: ArrowDown,
        hint: <Kbd>{formatShortcut(SHORTCUTS.moveDown)}</Kbd>,
        disabled: target.index === target.parent.childCount - 1,
        run: finish((block) => {
          if (moveBlock(editor, block, 1)) refocus();
        }),
      },
      {
        id: "delete",
        label: "Delete",
        icon: Trash2,
        hint: <Kbd>Del</Kbd>,
        destructive: true,
        separatorBefore: true,
        run: finish((block) => {
          deleteBlock(editor, block);
          editor.view.focus();
        }),
      },
    ];

    return { main, turnInto, color: [...colorEntries("text", textColor), ...colorEntries("background", backgroundColor)] };
    // The block cannot change while its menu is open, so its position identifies it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, request.pos, closeBlockMenu]);

  const needle = query.trim().toLowerCase();
  const visible: Entry[] = needle
    ? [
        ...entries.main.filter((entry) => !entry.submenu && !entry.disabled && matches(entry, needle)),
        ...(entries.main[0]?.disabled
          ? []
          : entries.turnInto.filter((entry) => matches(entry, needle)).map((entry) => ({ ...entry, hint: contextHint("Turn into") }))),
        ...(entries.main[1]?.disabled
          ? []
          : entries.color.filter((entry) => matches(entry, needle)).map((entry) => ({ ...entry, section: undefined, hint: contextHint("Color") }))),
      ].map((entry) => ({ ...entry, separatorBefore: false }))
    : entries.main;

  const submenuEntries = submenu ? entries[submenu.kind] : [];

  useEffect(() => {
    if (!target) closeBlockMenu(false);
  }, [target, closeBlockMenu]);

  if (!target) return null;

  const blockLabel = getBlockType(getBlockTypeId(target)).label;
  const optionId = (index: number) => `${listboxId}-${index}`;
  const subOptionId = (index: number) => `${submenuId}-${index}`;
  const activeDescendant = submenu?.focused ? subOptionId(submenu.active) : visible.length ? optionId(active) : undefined;

  const openSubmenu = (kind: SubmenuKind, focused: boolean) => {
    const list = entries[kind];
    const checked = list.findIndex((entry) => entry.checked);
    setSubmenu({ kind, focused, active: checked >= 0 ? checked : 0 });
  };

  const moveActive = (step: 1 | -1) => {
    if (submenu?.focused) {
      setSubmenu({ ...submenu, active: firstEnabled(submenuEntries, submenu.active + step, step) });
      return;
    }
    const next = firstEnabled(visible, active + step, step);
    setActive(next);
    if (!needle && visible[next]?.submenu && submenu) openSubmenu(visible[next].submenu, false);
    else setSubmenu(null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    const inSubmenu = Boolean(submenu?.focused);
    const current = inSubmenu && submenu ? submenuEntries[submenu.active] : visible[active];

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        moveActive(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        moveActive(-1);
        break;
      case "ArrowRight":
        if (!inSubmenu && current?.submenu && !current.disabled) {
          event.preventDefault();
          openSubmenu(current.submenu, true);
        }
        break;
      case "ArrowLeft":
        if (inSubmenu) {
          event.preventDefault();
          setSubmenu(null);
        }
        break;
      case "Enter":
        event.preventDefault();
        if (!current || current.disabled) break;
        if (!inSubmenu && current.submenu) openSubmenu(current.submenu, true);
        else current.run?.();
        break;
      case "Delete":
        if (!query) {
          event.preventDefault();
          entries.main.find((entry) => entry.id === "delete")?.run?.();
        }
        break;
      case "Escape":
        event.preventDefault();
        event.stopPropagation();
        if (submenu) setSubmenu(null);
        else closeBlockMenu(true);
        break;
      case "Tab":
        event.preventDefault();
        closeBlockMenu(true);
        break;
    }
  };

  const submenuRow = submenu ? rowRefs.current.get(submenu.kind) ?? null : null;

  return (
    <>
      <FloatingSurface open reference={request.reference} placement="bottom-start" onDismiss={() => closeBlockMenu(false)} className="w-64">
        <div className="border-b border-border p-1.5">
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-label={`Search actions for this ${blockLabel.toLowerCase()} block`}
            aria-expanded="true"
            aria-controls={submenu ? `${listboxId} ${submenuId}` : listboxId}
            aria-autocomplete="list"
            aria-activedescendant={activeDescendant}
            placeholder="Search actions…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
              setSubmenu(null);
            }}
            onKeyDown={handleKeyDown}
            className="h-8 w-full rounded-sm border border-input bg-background px-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/25"
          />
        </div>
        <div id={listboxId} role="listbox" aria-label={`${blockLabel} actions`} className="min-h-0 flex-1 overflow-y-auto p-1">
          {!needle ? <MenuSectionLabel>{blockLabel}</MenuSectionLabel> : null}
          {visible.map((entry, index) => (
            <Fragment key={entry.id}>
              {entry.separatorBefore ? <MenuSeparator /> : null}
              <MenuOption
                id={optionId(index)}
                rowRef={(element) => {
                  if (element) rowRefs.current.set(entry.submenu ?? entry.id, element);
                }}
                active={!submenu?.focused && index === active}
                label={entry.label}
                icon={entry.icon}
                swatch={entry.swatch}
                hint={entry.hint}
                checked={needle ? entry.checked : undefined}
                hasSubmenu={Boolean(entry.submenu)}
                disabled={entry.disabled}
                destructive={entry.destructive}
                onActivate={() => {
                  setActive(index);
                  if (entry.submenu && !entry.disabled) openSubmenu(entry.submenu, false);
                  else setSubmenu(null);
                }}
                onSelect={() => {
                  if (entry.submenu) openSubmenu(entry.submenu, false);
                  else entry.run?.();
                }}
              />
            </Fragment>
          ))}
          {needle && visible.length === 0 ? <p className="px-2 py-3 text-sm text-muted-foreground">No action matches “{query}”</p> : null}
        </div>
      </FloatingSurface>

      {submenu && !needle ? (
        <FloatingSurface open reference={submenuRow} placement="right-start" gap={4} maxHeight={420} className="w-56">
          <div
            id={submenuId}
            role="listbox"
            aria-label={submenu.kind === "turnInto" ? "Turn into" : "Color"}
            className="min-h-0 flex-1 overflow-y-auto p-1"
          >
            {submenuEntries.map((entry, index) => (
              <Fragment key={entry.id}>
                {entry.section ? (
                  <>
                    {index > 0 ? <MenuSeparator /> : null}
                    <MenuSectionLabel>{entry.section}</MenuSectionLabel>
                  </>
                ) : null}
                <MenuOption
                  id={subOptionId(index)}
                  active={Boolean(submenu.focused) && index === submenu.active}
                  label={entry.label}
                  icon={entry.icon}
                  swatch={entry.swatch}
                  checked={entry.checked}
                  onActivate={() => setSubmenu({ ...submenu, active: index, focused: true })}
                  onSelect={() => entry.run?.()}
                />
              </Fragment>
            ))}
          </div>
        </FloatingSurface>
      ) : null}
    </>
  );
}

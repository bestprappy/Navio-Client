"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/core";
import type { EditorState } from "@tiptap/pm/state";
import { NodeSelection } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { Bold, Check, ChevronDown, Code, Ellipsis, Italic, Link2, Link2Off, Strikethrough, Underline } from "lucide-react";

import { cn } from "@/lib/utils";

import { SELECTION_TOOLBAR_KEY, findBlockFromSelection, getBlockTypeId, turnBlockInto } from "./block-commands";
import { useBlockEditorContext } from "./block-editor-context";
import { CONVERTIBLE_BLOCK_TYPES, getBlockType, type BlockTypeId } from "./block-types";
import styles from "./block-editor.module.css";
import { ColorSwatch } from "./menu-parts";
import { NOTE_COLORS, NOTE_COLOR_LABELS, isNoteColor, normalizeHref, type NoteColor } from "./note-document";
import { SHORTCUTS, ariaShortcut, formatShortcut, type Shortcut } from "./shortcuts";
import { createVirtualReference } from "./use-floating-panel";

type Panel = "turnInto" | "color" | "link";
type MarkName = "bold" | "italic" | "underline" | "strike" | "code";

const MARK_BUTTONS: readonly { mark: MarkName; label: string; icon: typeof Bold; shortcut: Shortcut }[] = [
  { mark: "bold", label: "Bold", icon: Bold, shortcut: SHORTCUTS.bold },
  { mark: "italic", label: "Italic", icon: Italic, shortcut: SHORTCUTS.italic },
  { mark: "underline", label: "Underline", icon: Underline, shortcut: SHORTCUTS.underline },
  { mark: "strike", label: "Strikethrough", icon: Strikethrough, shortcut: SHORTCUTS.strike },
  { mark: "code", label: "Inline code", icon: Code, shortcut: SHORTCUTS.code },
];

function toolbarState({ editor }: { editor: Editor }) {
  const block = findBlockFromSelection(editor.state);
  const textColor: unknown = editor.getAttributes("textColor").color;
  const highlight: unknown = editor.getAttributes("highlight").color;
  const href: unknown = editor.getAttributes("link").href;
  return {
    bold: editor.isActive("bold"),
    italic: editor.isActive("italic"),
    underline: editor.isActive("underline"),
    strike: editor.isActive("strike"),
    code: editor.isActive("code"),
    link: editor.isActive("link"),
    href: typeof href === "string" ? href : "",
    textColor: isNoteColor(textColor) ? textColor : null,
    highlight: isNoteColor(highlight) ? highlight : null,
    blockType: (block ? getBlockTypeId(block) : "paragraph") as BlockTypeId,
  };
}

type ShouldShowProps = { editor: Editor; element: HTMLElement; view: EditorView; state: EditorState; from: number; to: number };

function shouldShowToolbar({ editor, element, view, state, from, to }: ShouldShowProps): boolean {
  if (!editor.isEditable || state.selection.empty || state.selection instanceof NodeSelection) return false;
  if (!view.hasFocus() && !element.contains(document.activeElement)) return false;
  if (!state.doc.textBetween(from, to, " ").trim()) return false;
  return !editor.isActive("codeBlock");
}

const preventBlur = (event: MouseEvent) => event.preventDefault();

/** Formatting for selected text. Alt+F10 moves focus here; Escape goes back to the text. */
export function BubbleToolbar() {
  const { viewReady } = useBlockEditorContext("BubbleToolbar");
  return viewReady ? <MountedBubbleToolbar /> : null;
}

function MountedBubbleToolbar() {
  const { editor, toolbarApiRef, openBlockMenu } = useBlockEditorContext("BubbleToolbar");
  const state = useEditorState({ editor, selector: toolbarState });
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [focusPanel, setFocusPanel] = useState(false);

  const buttons = () => Array.from(toolbarRef.current?.querySelectorAll<HTMLButtonElement>("[data-toolbar-item]") ?? []);

  const focusItem = (index: number) => {
    const items = buttons();
    if (!items.length) return;
    const next = (index + items.length) % items.length;
    items.forEach((item, itemIndex) => (item.tabIndex = itemIndex === next ? 0 : -1));
    items[next].focus();
  };

  const backToText = useCallback(() => {
    setPanel(null);
    editor.commands.focus();
  }, [editor]);

  const openPanel = (next: Panel, viaKeyboard: boolean) => {
    setFocusPanel(viaKeyboard);
    setPanel((current) => (current === next ? null : next));
  };

  useEffect(() => {
    toolbarApiRef.current = {
      focus: () => {
        if (!toolbarRef.current?.isConnected || !toolbarRef.current.offsetParent) return false;
        focusItem(0);
        return true;
      },
      openLink: () => {
        if (editor.state.selection.empty) return false;
        setFocusPanel(true);
        setPanel("link");
        return true;
      },
    };
    return () => {
      toolbarApiRef.current = null;
    };
  });

  const handleToolbarKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = buttons();
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    if (index === -1) return;
    const targets: Record<string, number> = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: items.length - 1 };
    if (event.key in targets) {
      event.preventDefault();
      focusItem(targets[event.key]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      backToText();
    }
  };

  const toggleMark = (mark: MarkName) => editor.chain().focus().toggleMark(mark).run();

  const openActions = (event: MouseEvent<HTMLButtonElement>) => {
    const block = findBlockFromSelection(editor.state);
    if (!block) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setPanel(null);
    openBlockMenu(block.pos, createVirtualReference(() => rect));
  };

  const currentType = getBlockType(state.blockType);

  return (
    <BubbleMenu
      editor={editor}
      pluginKey={SELECTION_TOOLBAR_KEY}
      shouldShow={shouldShowToolbar}
      appendTo={() => document.body}
      updateDelay={120}
      options={{ strategy: "fixed", placement: "top-start", offset: 8, flip: true, shift: { padding: 8 }, onHide: () => setPanel(null) }}
      className="z-50"
      data-note-floating=""
    >
      <div
        ref={toolbarRef}
        role="toolbar"
        aria-label="Text formatting"
        onKeyDown={handleToolbarKeyDown}
        className={cn(styles.surface, "flex items-center gap-0.5 p-1")}
      >
        <ToolbarButton
          label={`Turn into. Current: ${currentType.label}`}
          expanded={panel === "turnInto"}
          onClick={(event) => openPanel("turnInto", event.detail === 0)}
          className="gap-1.5 px-2"
          first
        >
          <currentType.icon className="size-4" aria-hidden="true" />
          <span className="max-w-24 truncate text-sm font-medium">{currentType.label}</span>
          <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarDivider />
        {MARK_BUTTONS.map(({ mark, label, icon: Icon, shortcut }) => (
          <ToolbarButton
            key={mark}
            label={label}
            title={`${label} (${formatShortcut(shortcut)})`}
            shortcut={ariaShortcut(shortcut)}
            pressed={state[mark]}
            onClick={() => toggleMark(mark)}
          >
            <Icon className="size-4" aria-hidden="true" />
          </ToolbarButton>
        ))}
        <ToolbarButton
          label={state.link ? "Edit link" : "Add link"}
          title={`Link (${formatShortcut(SHORTCUTS.link)})`}
          shortcut={ariaShortcut(SHORTCUTS.link)}
          pressed={state.link}
          expanded={panel === "link"}
          onClick={(event) => openPanel("link", event.detail === 0)}
        >
          <Link2 className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton label="Text color" expanded={panel === "color"} onClick={(event) => openPanel("color", event.detail === 0)}>
          <ColorSwatch color={state.textColor} kind="text" className="size-5 border-0" />
        </ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton label="More block actions" title={`More (${formatShortcut(SHORTCUTS.blockMenu)})`} onClick={openActions}>
          <Ellipsis className="size-4" aria-hidden="true" />
        </ToolbarButton>
      </div>

      {panel === "turnInto" ? (
        <TurnIntoPanel
          current={state.blockType}
          autoFocus={focusPanel}
          onClose={() => {
            setPanel(null);
            focusItem(0);
          }}
          onPick={(typeId) => {
            setPanel(null);
            const block = findBlockFromSelection(editor.state);
            if (block) turnBlockInto(editor, block, typeId);
          }}
        />
      ) : null}
      {panel === "color" ? (
        <ColorPanel
          textColor={state.textColor}
          highlight={state.highlight}
          autoFocus={focusPanel}
          onClose={() => setPanel(null)}
          onPick={(kind, color) => {
            const mark = kind === "text" ? "textColor" : "highlight";
            const chain = editor.chain().focus();
            (color ? chain.setMark(mark, { color }) : chain.unsetMark(mark)).run();
          }}
        />
      ) : null}
      {panel === "link" ? (
        <LinkPanel
          href={state.href}
          hasLink={state.link}
          onCancel={backToText}
          onApply={(href) => {
            editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
            setPanel(null);
          }}
          onRemove={() => {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            setPanel(null);
          }}
        />
      ) : null}
    </BubbleMenu>
  );
}

type ToolbarButtonProps = {
  label: string;
  title?: string;
  shortcut?: string;
  pressed?: boolean;
  expanded?: boolean;
  first?: boolean;
  className?: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
};

function ToolbarButton({ label, title, shortcut, pressed, expanded, first = false, className, onClick, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      data-toolbar-item
      tabIndex={first ? 0 : -1}
      aria-label={label}
      title={title ?? label}
      aria-keyshortcuts={shortcut}
      aria-pressed={pressed}
      aria-expanded={expanded}
      aria-haspopup={expanded === undefined ? undefined : "menu"}
      onMouseDown={preventBlur}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 min-w-8 items-center justify-center rounded-sm text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        pressed && "bg-primary/10 text-primary hover:bg-primary/15",
        expanded && "bg-muted",
        className,
      )}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span aria-hidden="true" className="mx-0.5 h-5 w-px bg-border" />;
}

function menuItems(panel: HTMLElement | null): HTMLButtonElement[] {
  return Array.from(panel?.querySelectorAll<HTMLButtonElement>("[role^='menuitem']") ?? []);
}

/** Arrow keys move focus between the panel's items; Escape closes it. */
function usePanelKeys(columns: number, onClose: () => void, autoFocus: boolean) {
  const panelRef = useRef<HTMLDivElement>(null);
  const items = () => menuItems(panelRef.current);

  useEffect(() => {
    if (!autoFocus) return;
    const all = menuItems(panelRef.current);
    (all.find((item) => item.getAttribute("aria-checked") === "true") ?? all[0])?.focus();
  }, [autoFocus]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const all = items();
    const index = all.indexOf(document.activeElement as HTMLButtonElement);
    const steps: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: columns, ArrowUp: -columns };
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }
    if (index === -1 || !(event.key in steps)) return;
    event.preventDefault();
    const next = Math.min(all.length - 1, Math.max(0, index + steps[event.key]));
    all[next]?.focus();
  };

  return { panelRef, onKeyDown };
}

const panelClass = cn(styles.surface, "absolute top-full left-0 mt-1.5 p-1");

function TurnIntoPanel({
  current,
  autoFocus,
  onClose,
  onPick,
}: {
  current: BlockTypeId;
  autoFocus: boolean;
  onClose: () => void;
  onPick: (typeId: BlockTypeId) => void;
}) {
  const { panelRef, onKeyDown } = usePanelKeys(1, onClose, autoFocus);
  return (
    <div ref={panelRef} role="menu" aria-label="Turn into" onKeyDown={onKeyDown} className={cn(panelClass, "flex max-h-80 w-52 flex-col overflow-y-auto")}>
      {CONVERTIBLE_BLOCK_TYPES.map((type) => (
        <button
          key={type.id}
          type="button"
          role="menuitemradio"
          aria-checked={type.id === current}
          tabIndex={-1}
          onMouseDown={preventBlur}
          onClick={() => onPick(type.id)}
          className="flex min-h-8 items-center gap-2.5 rounded-sm px-2 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
        >
          <type.icon className="size-4 text-muted-foreground" aria-hidden="true" />
          <span className="flex-1">{type.label}</span>
          {type.id === current ? <Check className="size-4 text-primary" aria-hidden="true" /> : null}
        </button>
      ))}
    </div>
  );
}

function ColorPanel({
  textColor,
  highlight,
  autoFocus,
  onClose,
  onPick,
}: {
  textColor: NoteColor | null;
  highlight: NoteColor | null;
  autoFocus: boolean;
  onClose: () => void;
  onPick: (kind: "text" | "background", color: NoteColor | null) => void;
}) {
  const { panelRef, onKeyDown } = usePanelKeys(5, onClose, autoFocus);
  const palette: (NoteColor | null)[] = [null, ...NOTE_COLORS];

  const section = (kind: "text" | "background", current: NoteColor | null) => (
    <div role="group" aria-label={kind === "text" ? "Text color" : "Background color"}>
      <p className="px-1.5 pt-1.5 pb-1 text-xs font-medium text-muted-foreground">{kind === "text" ? "Text" : "Background"}</p>
      <div className="grid grid-cols-5 gap-1 px-1">
        {palette.map((color) => {
          const name = color ? NOTE_COLOR_LABELS[color] : "Default";
          return (
            <button
              key={color ?? "default"}
              type="button"
              role="menuitemradio"
              aria-checked={current === color}
              aria-label={kind === "text" ? `${name} text` : `${name} background`}
              title={kind === "text" ? `${name} text` : `${name} background`}
              tabIndex={-1}
              onMouseDown={preventBlur}
              onClick={() => onPick(kind, color)}
              className={cn(
                "grid size-8 place-items-center rounded-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                current === color && "ring-2 ring-primary/60",
              )}
            >
              <ColorSwatch color={color} kind={kind} />
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div ref={panelRef} role="menu" aria-label="Color" onKeyDown={onKeyDown} className={cn(panelClass, "w-56 pb-2")}>
      {section("text", textColor)}
      {section("background", highlight)}
    </div>
  );
}

function LinkPanel({
  href,
  hasLink,
  onApply,
  onRemove,
  onCancel,
}: {
  href: string;
  hasLink: boolean;
  onApply: (href: string) => void;
  onRemove: () => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(href);
  const [error, setError] = useState<string | null>(null);
  const errorId = useId();

  const submit = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    const normalized = normalizeHref(draft);
    if (!normalized) {
      setError("Enter a web address like example.com, or an email address.");
      return;
    }
    onApply(normalized);
  };

  return (
    <form onSubmit={submit} className={cn(panelClass, "flex w-72 flex-col gap-1.5 p-2")}>
      <div className="flex items-center gap-1.5">
        <input
          autoFocus
          type="text"
          inputMode="url"
          aria-label="Link address"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          placeholder="Paste or type a link"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              onCancel();
            }
          }}
          className="h-8 min-w-0 flex-1 rounded-sm border border-input bg-background px-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/25"
        />
        <button
          type="submit"
          className="h-8 rounded-sm bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          Apply
        </button>
      </div>
      {error ? (
        <p id={errorId} className="px-0.5 text-xs text-destructive">
          {error}
        </p>
      ) : null}
      {hasLink ? (
        <button
          type="button"
          onClick={onRemove}
          className="flex h-8 items-center gap-2 rounded-sm px-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <Link2Off className="size-4" aria-hidden="true" />
          Remove link
        </button>
      ) : null}
    </form>
  );
}

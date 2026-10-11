"use client";

import { Fragment, useEffect, useId, useMemo, useRef, useSyncExternalStore } from "react";

import { hasEditorView, useBlockEditorContext } from "./block-editor-context";
import { FloatingSurface, Kbd, MenuOption, MenuSeparator } from "./menu-parts";
import { createVirtualReference } from "./use-floating-panel";

const EDITOR_ARIA = ["aria-expanded", "aria-controls", "aria-activedescendant", "aria-autocomplete"] as const;

/** The block menu that "/" opens at the caret. Focus stays in the editor; the keys arrive through the store. */
export function SlashMenu() {
  const { viewReady } = useBlockEditorContext("SlashMenu");
  return viewReady ? <MountedSlashMenu /> : null;
}

function MountedSlashMenu() {
  const { editor, slashStore } = useBlockEditorContext("SlashMenu");
  const state = useSyncExternalStore(slashStore.subscribe, slashStore.getSnapshot, slashStore.getSnapshot);
  const listboxId = useId();
  const optionId = (index: number) => `${listboxId}-option-${index}`;
  const rowRefs = useRef<Array<HTMLDivElement | null>>([]);

  const reference = useMemo(
    () =>
      state.getAnchorRect && hasEditorView(editor) ? createVirtualReference(state.getAnchorRect, editor.view.dom) : null,
    [state.getAnchorRect, editor],
  );

  // The editor is the combobox: it owns focus, the menu is its popup.
  useEffect(() => {
    if (!hasEditorView(editor)) return;
    const dom = editor.view.dom;
    if (!state.open) {
      EDITOR_ARIA.forEach((attribute) => dom.removeAttribute(attribute));
      return;
    }
    dom.setAttribute("aria-expanded", "true");
    dom.setAttribute("aria-controls", listboxId);
    dom.setAttribute("aria-autocomplete", "list");
    if (state.items.length) dom.setAttribute("aria-activedescendant", `${listboxId}-option-${state.activeIndex}`);
    else dom.removeAttribute("aria-activedescendant");
  }, [editor, listboxId, state.open, state.items.length, state.activeIndex]);

  useEffect(() => {
    rowRefs.current[state.activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [state.activeIndex, state.items]);

  return (
    <FloatingSurface
      open={state.open}
      reference={reference}
      placement="bottom-start"
      maxHeight={340}
      onDismiss={slashStore.close}
      className="w-64"
    >
      <div id={listboxId} role="listbox" aria-label="Blocks" className="min-h-0 flex-1 overflow-y-auto p-1">
        {state.items.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">No block matches “{state.query}”</p>
        ) : (
          state.items.map((item, index) => (
            <Fragment key={item.id}>
              {index > 0 && state.items[index - 1].group !== item.group && !state.query ? <MenuSeparator /> : null}
              <MenuOption
                id={optionId(index)}
                rowRef={(element) => {
                  rowRefs.current[index] = element;
                }}
                active={index === state.activeIndex}
                label={item.label}
                icon={item.icon}
                tile
                hint={item.markdown ? <Kbd>{item.markdown}</Kbd> : null}
                onActivate={() => slashStore.setActiveIndex(index)}
                onSelect={() => slashStore.select(index)}
              />
            </Fragment>
          ))
        )}
      </div>
      <div className="flex items-center justify-between border-t border-border px-3 py-1.5 text-xs text-muted-foreground">
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(event) => event.preventDefault()}
          onClick={slashStore.close}
          className="rounded-xs hover:text-foreground"
        >
          Close menu
        </button>
        <Kbd>Esc</Kbd>
      </div>
    </FloatingSurface>
  );
}

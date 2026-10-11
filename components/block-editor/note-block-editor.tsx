"use client";

import type { ReactNode } from "react";

import { BlockEditor, type InitialFocus } from "./block-editor";

export type NoteBlockEditorProps = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
  restingIcon?: ReactNode;
  initialFocus?: InitialFocus;
};

/** The full editor, loaded on demand by {@link NoteEditor}. */
export default function NoteBlockEditor({ value, onChange, label, placeholder, restingIcon, initialFocus }: NoteBlockEditorProps) {
  return (
    <BlockEditor.Root value={value} onChange={onChange} label={label} placeholder={placeholder} initialFocus={initialFocus}>
      <BlockEditor.Gutter restingIcon={restingIcon} />
      <BlockEditor.Content />
      <BlockEditor.SlashMenu />
      <BlockEditor.BubbleToolbar />
      <BlockEditor.BlockMenu />
    </BlockEditor.Root>
  );
}

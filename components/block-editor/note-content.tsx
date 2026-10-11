"use client";

import { memo, useMemo, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import styles from "./block-editor.module.css";
import {
  CALLOUT_TONE_LABELS,
  HEADING_TAGS,
  isCalloutTone,
  isNoteColor,
  isSafeHref,
  toHeadingLevel,
  type NoteMark,
  type NoteNode,
} from "./note-document";
import { parseNoteMarkdown } from "./note-markdown";

/**
 * Renders a note without the editor. Its markup mirrors the editor's, so the
 * shared stylesheet makes both look the same.
 *
 * <p>`readonly` is for people who cannot edit: links open and toggles expand.
 * `preview` stands in for the editor before it loads: nothing inside is
 * interactive, because any press opens the editor at that spot.
 */
export type NoteContentMode = "readonly" | "preview";

type RenderContext = { mode: NoteContentMode };

const EXTERNAL_LINK_REL = "noopener noreferrer nofollow ugc";

function textOf(node: NoteNode): string {
  if (node.type === "text") return node.text ?? "";
  return (node.content ?? []).map(textOf).join(node.type === "paragraph" ? "" : " ");
}

function wrapMark(mark: NoteMark, child: ReactNode, key: string, context: RenderContext): ReactNode {
  switch (mark.type) {
    case "bold":
      return <strong key={key}>{child}</strong>;
    case "italic":
      return <em key={key}>{child}</em>;
    case "underline":
      return <u key={key}>{child}</u>;
    case "strike":
      return <s key={key}>{child}</s>;
    case "code":
      return <code key={key}>{child}</code>;
    case "textColor":
      return isNoteColor(mark.attrs?.color) ? (
        <span key={key} data-color={String(mark.attrs?.color)}>
          {child}
        </span>
      ) : (
        child
      );
    case "highlight":
      return isNoteColor(mark.attrs?.color) ? (
        <mark key={key} data-color={String(mark.attrs?.color)}>
          {child}
        </mark>
      ) : (
        child
      );
    case "link": {
      const href = mark.attrs?.href;
      if (!isSafeHref(href) || typeof href !== "string") return child;
      if (context.mode === "preview") return <a key={key}>{child}</a>;
      return (
        <a key={key} href={href} target="_blank" rel={EXTERNAL_LINK_REL}>
          {child}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      );
    }
    default:
      return child;
  }
}

function renderInline(nodes: readonly NoteNode[] | undefined, context: RenderContext): ReactNode[] {
  return (nodes ?? []).map((node, index) => {
    if (node.type === "hardBreak") return <br key={index} />;
    if (node.type !== "text") return null;
    // Outermost mark first, matching the editor's nesting.
    return [...(node.marks ?? [])]
      .reverse()
      .reduce<ReactNode>((child, mark, markIndex) => wrapMark(mark, child, `${index}-${markIndex}`, context), node.text ?? "");
  });
}

function renderBlocks(nodes: readonly NoteNode[] | undefined, context: RenderContext): ReactNode[] {
  return (nodes ?? []).map((node, index) => <Block key={index} node={node} context={context} />);
}

function Block({ node, context }: { node: NoteNode; context: RenderContext }): ReactNode {
  switch (node.type) {
    case "paragraph":
      return <p>{node.content?.length ? renderInline(node.content, context) : <br />}</p>;
    case "heading": {
      const level = toHeadingLevel(node.attrs?.level);
      const Tag = HEADING_TAGS[level];
      return <Tag data-level={level}>{node.content?.length ? renderInline(node.content, context) : <br />}</Tag>;
    }
    case "bulletList":
      return <ul>{renderBlocks(node.content, context)}</ul>;
    case "orderedList": {
      const start = typeof node.attrs?.start === "number" ? node.attrs.start : 1;
      return <ol start={start}>{renderBlocks(node.content, context)}</ol>;
    }
    case "listItem":
      return <li>{renderBlocks(node.content, context)}</li>;
    case "taskList":
      return <ul data-type="taskList">{renderBlocks(node.content, context)}</ul>;
    case "taskItem": {
      const checked = Boolean(node.attrs?.checked);
      const label = `${checked ? "Done" : "To do"}: ${textOf(node).trim() || "empty item"}`;
      return (
        <li data-checked={String(checked)}>
          <label>
            <input
              type="checkbox"
              checked={checked}
              disabled={context.mode === "readonly"}
              tabIndex={context.mode === "preview" ? -1 : undefined}
              aria-label={label}
              onChange={() => undefined}
            />
          </label>
          <div>{renderBlocks(node.content, context)}</div>
        </li>
      );
    }
    case "blockquote":
      return <blockquote>{renderBlocks(node.content, context)}</blockquote>;
    case "callout": {
      const requestedTone = node.attrs?.tone;
      const tone = isCalloutTone(requestedTone) ? requestedTone : "note";
      return (
        <div data-type="callout" data-tone={tone} role="note" aria-label={CALLOUT_TONE_LABELS[tone]}>
          <span data-callout-icon="" aria-hidden="true" />
          <div data-callout-body="">{renderBlocks(node.content, context)}</div>
        </div>
      );
    }
    case "details":
      return <StaticToggle node={node} context={context} />;
    case "codeBlock":
      return (
        <pre>
          <code>{textOf(node)}</code>
        </pre>
      );
    case "horizontalRule":
      return <hr />;
    default:
      return node.content ? <>{renderBlocks(node.content, context)}</> : null;
  }
}

function StaticToggle({ node, context }: { node: NoteNode; context: RenderContext }) {
  const [open, setOpen] = useState(Boolean(node.attrs?.open));
  const summary = node.content?.find((child) => child.type === "detailsSummary");
  const content = node.content?.find((child) => child.type === "detailsContent");
  const interactive = context.mode === "readonly";

  return (
    <div data-type="details" className={cn(open && "is-open")}>
      <button
        type="button"
        data-details-toggle=""
        tabIndex={interactive ? undefined : -1}
        aria-expanded={open}
        aria-label={open ? "Collapse toggle" : "Expand toggle"}
        onClick={interactive ? () => setOpen((current) => !current) : undefined}
      />
      <div data-details-body="">
        <div data-summary="">{summary?.content?.length ? renderInline(summary.content, context) : <br />}</div>
        <div data-type="detailsContent">{renderBlocks(content?.content, context)}</div>
      </div>
    </div>
  );
}

type NoteContentProps = {
  content: string;
  mode: NoteContentMode;
  /** Shown in place of an empty note. */
  emptyText?: string;
  className?: string;
};

export const NoteContent = memo(function NoteContent({ content, mode, emptyText, className }: NoteContentProps) {
  const document = useMemo(() => parseNoteMarkdown(content), [content]);
  const context = useMemo<RenderContext>(() => ({ mode }), [mode]);
  const isEmpty = !content.trim();

  return (
    <div className={cn(styles.content, className)}>
      {isEmpty ? (
        <p className={styles.emptyNote} data-placeholder={emptyText ?? ""}>
          <br />
        </p>
      ) : (
        renderBlocks(document.content, context)
      )}
    </div>
  );
});

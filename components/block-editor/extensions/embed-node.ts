import { Node, mergeAttributes, type Attributes } from "@tiptap/core";
import { ReactNodeViewRenderer, type ReactNodeViewProps } from "@tiptap/react";
import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";

import { EMBED_GROUP, isEmbedValue, toEmbedDataName, type NoteEmbedCodec } from "../note-embeds";

/** A host block registered with {@link BlockEditor.Root}'s `embeds`. */
export type NoteEmbed = NoteEmbedCodec & {
  label: string;
  icon: LucideIcon;
  keywords: readonly string[];
  /** False for a block the host inserts itself, which the slash menu does not offer. */
  menu?: boolean;
  /** Prompt on the empty line straight after the block, such as "Write about this place". */
  placeholderAfter?: string;
  /** Attributes for a block inserted from the slash menu, such as a fresh list id. */
  createAttributes: () => Record<string, string>;
  /** Built with {@link createEmbedNode}. */
  node: Node;
};

type EmbedNodeOptions = NoteEmbedCodec & {
  component: ComponentType<ReactNodeViewProps>;
};

/**
 * An atom block drawn by a React component. Its attributes are ids only; the
 * component looks up what they point to. Moving and deleting it go through
 * the gutter handle and block menu like any block.
 */
export function createEmbedNode({ name, attributes, component }: EmbedNodeOptions): Node {
  return Node.create({
    name,
    group: `block ${EMBED_GROUP}`,
    atom: true,
    selectable: true,
    // The gutter handle drags blocks; a draggable view would also grab text selections in its inputs.
    draggable: false,

    addAttributes() {
      const specs: Attributes = {};
      for (const attribute of attributes) {
        const dataName = `data-${toEmbedDataName(attribute)}`;
        specs[attribute] = {
          default: null,
          parseHTML: (element) => {
            const value = element.getAttribute(dataName);
            return isEmbedValue(value) ? value : null;
          },
          renderHTML: (values) => (isEmbedValue(values[attribute]) ? { [dataName]: values[attribute] } : {}),
        };
      }
      return specs;
    },

    parseHTML() {
      return [{ tag: `div[data-embed="${name}"]` }];
    },

    renderHTML({ HTMLAttributes }) {
      return ["div", mergeAttributes(HTMLAttributes, { "data-embed": name })];
    },

    addNodeView() {
      // The component must render a NodeViewWrapper; `data-embed` scopes the editor's reset styles.
      return ReactNodeViewRenderer(component, { attrs: { "data-embed": name } });
    },
  });
}

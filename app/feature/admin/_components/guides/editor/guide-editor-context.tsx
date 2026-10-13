"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { guideOutline, type Guide, type OutlineSection } from "../guide-model";
import { guideDraftsAtom, updateGuideAtom } from "../guides.atoms";

import { adminGuideWorkspace, type GuideWorkspace } from "../guide-workspace";

type GuideEditorContextValue = {
  workspace: GuideWorkspace;
  guideId: string;
  /** The guide as it was when the editor opened, used until its draft is in place. */
  fallback: Guide;
  updateGuide: (update: (guide: Guide) => Guide) => void;
};

const GuideEditorContext = createContext<GuideEditorContextValue | null>(null);

/** The guide being edited, for the editor's parts, including the blocks inside the text. */
export function GuideEditorProvider({ guide, children, workspace = adminGuideWorkspace }: { guide: Guide; children: ReactNode; workspace?: GuideWorkspace }) {
  const setGuide = useSetAtom(updateGuideAtom);
  const guideId = guide.id;
  const updateGuide = useCallback((update: (current: Guide) => Guide) => setGuide({ guideId, update }), [guideId, setGuide]);
  const value = useMemo(() => ({ guideId, fallback: guide, updateGuide, workspace }), [guide, guideId, updateGuide, workspace]);
  return <GuideEditorContext.Provider value={value}>{children}</GuideEditorContext.Provider>;
}

/**
 * The current guide and how to change it. Reads the store directly: a block
 * the text editor mounts mid-update sees a place saved a moment before.
 */
export function useGuideEditor(componentName: string): { guide: Guide; workspace: GuideWorkspace; sections: OutlineSection[]; updateGuide: GuideEditorContextValue["updateGuide"] } {
  const context = useContext(GuideEditorContext);
  if (!context) throw new Error(`${componentName} must be rendered inside <GuideEditorProvider>.`);
  const guide = useAtomValue(guideDraftsAtom)[context.guideId] ?? context.fallback;
  const sections = useMemo(() => guideOutline(guide), [guide]);
  return { guide, sections, workspace: context.workspace, updateGuide: context.updateGuide };
}

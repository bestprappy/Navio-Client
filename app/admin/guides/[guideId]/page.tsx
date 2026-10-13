import type { Metadata } from "next";

import { GuideEditor } from "@/app/feature/admin/_components/guides/editor/guide-editor";

export const metadata: Metadata = { title: "Edit guide - Admin - Navio" };

export default async function GuideEditorPage({ params }: { params: Promise<{ guideId: string }> }) {
  const { guideId } = await params;
  return <GuideEditor guideId={guideId} />;
}

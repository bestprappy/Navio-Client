import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UserGuideEditor } from "@/app/feature/guides/user-guide-editor";
import { GUIDE_ID_PATTERN } from "@/app/api/admin/guides/guide-routes";
export const metadata: Metadata = { title: "Write your guide - Navio" };
export default async function UserGuideEditorPage({
  params,
}: {
  params: Promise<{ guideId: string }>;
}) {
  const { guideId } = await params;
  if (!GUIDE_ID_PATTERN.test(guideId)) notFound();
  return (
    <div className="h-full min-h-0">
      <UserGuideEditor guideId={guideId} />
    </div>
  );
}

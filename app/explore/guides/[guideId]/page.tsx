import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { GuideReader } from "@/app/feature/guides/guide-reader";
import { ExploreErrorBoundary } from "@/app/feature/explore/_components/explore-error-boundary";
import { GUIDE_ID_PATTERN } from "@/app/api/admin/guides/guide-routes";
export const metadata: Metadata = { title: "Traveler guide - Navio" };
export default async function TravelerGuidePage({
  params,
}: {
  params: Promise<{ guideId: string }>;
}) {
  const { guideId } = await params;
  if (!GUIDE_ID_PATTERN.test(guideId)) notFound();
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Navbar />
      <main className="min-h-0 min-w-0 flex-1 overflow-hidden bg-background">
        <ExploreErrorBoundary fallbackTitle="Guide unavailable">
          <GuideReader guideId={guideId} />
        </ExploreErrorBoundary>
      </main>
    </div>
  );
}

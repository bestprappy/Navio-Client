import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { GuideReader } from "@/app/feature/guides/guide-reader";
import { ExploreErrorBoundary } from "@/app/feature/explore/_components/explore-error-boundary";
import { GUIDE_ID_PATTERN } from "@/app/api/admin/guides/guide-routes";
export const metadata: Metadata = { title: "Traveler guide - Navio" };
export default async function TravelerGuidePage({
  params,searchParams,
}: {
  params: Promise<{ guideId: string }>;searchParams:Promise<{source?:string}>;
}) {
  const { guideId } = await params;const source=(await searchParams).source==="curated"?"CURATED":"TRAVELER";
  if (!GUIDE_ID_PATTERN.test(guideId)) notFound();
  return (
    <div className="fixed inset-0 flex min-h-0 flex-col overflow-hidden">
      <div className="max-h-[70dvh] shrink-0 overflow-y-auto"><Navbar /></div>
      <main className="min-h-0 min-w-0 flex-1 overflow-hidden bg-background">
        <ExploreErrorBoundary fallbackTitle="Guide unavailable">
          <GuideReader guideId={guideId} source={source}/>
        </ExploreErrorBoundary>
      </main>
    </div>
  );
}

import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { PlaceReader } from "@/app/feature/explore/places/place-reader";
import { PlaceReaderViewport } from "@/app/feature/explore/places/place-reader-viewport";
import { placesEnabled } from "@/app/feature/explore/places/places-config";
export const metadata: Metadata = { title: "Discover a place - Navio" };
export default async function PlaceRoute({
  params,
}: {
  params: Promise<{ placeId: string }>;
}) {
  if (!placesEnabled) notFound();
  const { placeId } = await params;
  return (
    <PlaceReaderViewport navigation={<Navbar />}>
      <Suspense fallback={<p className="p-6">Loading place…</p>}>
        <PlaceReader key={placeId} placeId={placeId} />
      </Suspense>
    </PlaceReaderViewport>
  );
}

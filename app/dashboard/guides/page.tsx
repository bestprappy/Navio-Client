import type { Metadata } from "next";
import { YourGuides } from "@/app/feature/guides/your-guides";
export const metadata: Metadata = { title: "Your Guides - Navio" };

type YourGuidesPageProps = {
  searchParams: Promise<{ new?: string | string[] }>;
};

/** `?new=1` (linked from the trip setup screen) opens the new-guide dialog. */
export default async function YourGuidesPage({ searchParams }: YourGuidesPageProps) {
  const { new: startNewGuide } = await searchParams;
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 lg:px-10">
      <YourGuides startNewGuide={startNewGuide === "1"} />
    </div>
  );
}

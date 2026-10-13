import type { Metadata } from "next";
import { YourGuides } from "@/app/feature/guides/your-guides";
export const metadata: Metadata = { title: "Your Guides - Navio" };
export default function YourGuidesPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 lg:px-10">
      <YourGuides />
    </div>
  );
}

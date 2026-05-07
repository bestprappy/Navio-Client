import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { ExplorePage } from "./_components/explore-page";

export const metadata: Metadata = {
  title: "Explore plans - Navio",
  description:
    "Discover trending EV trip plans and recent guides across Thailand.",
};

export default function ExploreRoute() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <ExplorePage />
      </main>
    </>
  );
}

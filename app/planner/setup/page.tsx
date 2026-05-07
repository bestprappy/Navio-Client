import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { PlannerSetupView } from "./_components/planner-setup";

export const metadata: Metadata = {
  title: "Plan a new trip - Navio",
  description: "Set your destination and dates to start planning your EV trip.",
};

export default function PlannerSetupPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <PlannerSetupView />
      </main>
    </>
  );
}

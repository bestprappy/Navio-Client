import type { Metadata } from "next";

import { PlannerSetupView } from "../feature/planner/planner-setup";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "Plan a new trip - Navio",
  description: "Set your destination and dates to start planning your EV trip.",
};

export default function PlannerSetupPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Navbar />
      <main className="min-h-0 flex-1 overflow-auto">
        <PlannerSetupView />
      </main>
    </div>
  );
}

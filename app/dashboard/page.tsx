import type { Metadata } from "next";

import { PlannerHomeView } from "../feature/planner/planner-home";

export const metadata: Metadata = {
  title: "Dashboard - Navio",
  description: "Review your saved trips or start planning a new EV journey.",
};

export default function DashboardPage() {
  return <PlannerHomeView />;
}

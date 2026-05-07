import type { Metadata } from "next";
import { Home } from "./_components/home";

export const metadata: Metadata = {
  title: "Trip Planner — Navio",
  description:
    "Plan your EV road trip with smart charging stops and real-time route optimization.",
};

export default function HomePage() {
  return <Home />;
}

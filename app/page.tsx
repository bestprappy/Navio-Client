import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { HomeExperience } from "./_components/home-experience";

export const metadata: Metadata = {
  title: "Navio — Make room for the trip",
  description: "Find trip ideas, arrange your itinerary, and keep places, budgets and EV charging stops together in Navio.",
};

export default function Home() {
  return <><Navbar /><HomeExperience /><Footer /></>;
}

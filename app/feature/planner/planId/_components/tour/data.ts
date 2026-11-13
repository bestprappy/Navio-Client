import type { TourDefinition } from "@/components/tour/tour.types";

/** First-time tips for `/planner/[planId]`, shown to the trip's owner. */
export const PLANNER_TOUR: TourDefinition = {
  id: "planner",
  version: 1,
  label: "Trip planner",
  steps: [
    {
      title: "This is your trip planner",
      description: "Your plan and the map work together: whatever you add here appears on the map. Here's what each part does.",
    },
    {
      target: "planner.my-list",
      title: "Collect places in My List",
      description: "Save places you might visit, then move them into a day when you're ready.",
      side: "bottom",
    },
    {
      target: "planner.itinerary",
      title: "Plan your days",
      description: "Each day keeps its stops in order. Open a day to add places, notes and checklists.",
      side: "bottom",
    },
    {
      target: "planner.day-options",
      title: "Let Auto plan order a day",
      description: "Open a day's menu and choose Auto plan. It orders your places around meals and opening hours, and nothing changes until you apply it.",
      side: "left",
    },
    {
      target: "planner.garage",
      title: "Add your EV",
      description: "Choose your car in My garage so battery estimates and charging stops fit how far it can go.",
      side: "bottom",
    },
    {
      target: "planner.budget",
      title: "Keep an eye on costs",
      description: "Set a budget and add expenses to see what the trip will cost.",
      side: "top",
    },
    {
      target: "planner.trip-options",
      title: "Share your plan",
      description: "Open Trip options to publish the plan as a link, or to manage the trip.",
      side: "bottom",
      align: "end",
    },
    {
      target: "help",
      title: "Replay these tips",
      description: "Choose Show tips in the sidebar whenever you want this tour again.",
      side: "right",
    },
  ],
};

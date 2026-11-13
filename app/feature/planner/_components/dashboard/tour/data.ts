import type { TourDefinition } from "@/components/tour/tour.types";

/** First-time tips for `/dashboard`. Targets are `data-tour` values in the dashboard and app sidebar. */
export const DASHBOARD_TOUR: TourDefinition = {
  id: "dashboard",
  version: 1,
  label: "Dashboard",
  steps: [
    {
      title: "Welcome to Navio",
      description: "Here's a quick look around your dashboard. It takes about 30 seconds, and you can replay it any time.",
    },
    {
      target: "dashboard.new-trip",
      title: "Start a trip",
      description: "Pick a destination and dates. Navio sets up a day for each date, ready for you to fill in.",
      side: "bottom",
      align: "end",
    },
    {
      target: "dashboard.trips",
      title: "Your upcoming trips",
      description: "Every trip you plan lands here. Open one to pick up where you left off.",
      side: "top",
    },
    {
      target: "dashboard.explore",
      title: "Start from a shared plan",
      description: "Browse itineraries other travelers shared and borrow the stops that fit your trip.",
      side: "top",
    },
    {
      target: "sidebar.trips",
      title: "Jump between trips",
      description: "Your trips also stay in the sidebar, so you can switch without coming back here.",
      side: "right",
    },
    {
      target: "sidebar.notifications",
      title: "Stay in the loop",
      description: "Replies and activity on your posts and plans show up in Notifications.",
      side: "right",
      requiresAuth: true,
    },
    {
      target: "help",
      title: "Replay these tips",
      description: "Choose Show tips on any page that has a tour to see it again.",
      side: "right",
    },
  ],
};

import type { TourDefinition } from "@/components/tour/tour.types";

/** First-time tips for `/community` and `/community/popular`. */
export const COMMUNITY_TOUR: TourDefinition = {
  id: "community",
  version: 1,
  label: "Community",
  steps: [
    {
      title: "Welcome to the community",
      description: "Ask questions, share trip plans and learn from other EV travelers. Here's how to find your way around.",
    },
    {
      target: "community.sections",
      title: "Home and Popular",
      description: "Home shows posts from communities you joined. Popular shows the most upvoted posts from everywhere.",
      side: "right",
    },
    {
      target: "community.search",
      title: "Search",
      description: "Find posts and communities by keyword.",
      side: "bottom",
    },
    {
      target: "community.create-post",
      title: "Create a post",
      description: "Ask a question or share a trip plan with one of your communities.",
      side: "bottom",
      align: "end",
    },
    {
      target: "community.create-group",
      title: "Start a community",
      description: "Create a group around a route, a region or anything you love about the road.",
      side: "right",
    },
    {
      target: "community.popular-groups",
      title: "Find communities to join",
      description: "Popular communities are a good place to start. Join a few to fill your Home feed.",
      side: "left",
    },
    {
      target: "help",
      title: "Replay these tips",
      description: "Choose this button whenever you want the tour again.",
      side: "bottom",
      align: "end",
    },
  ],
};

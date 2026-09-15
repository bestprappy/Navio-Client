import type { ExploreItem } from "./types";

export function getExploreItems(destinationName: string): ExploreItem[] {
  return [
    {
      id: "attractions",
      title: `Best attractions in ${destinationName}`,
      subtitle: "Most often-seen on the web",
      source: "Navio",
      imageUrl:
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80",
      gradient:
        "linear-gradient(135deg, var(--planner-block-lime) 0%, var(--planner-block-emerald) 100%)",
    },
    {
      id: "restaurants",
      title: `Best restaurants in ${destinationName}`,
      subtitle: "Most often-seen on the web",
      source: "Navio",
      imageUrl:
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80",
      gradient:
        "linear-gradient(135deg, var(--planner-block-amber) 0%, var(--planner-block-coral) 100%)",
    },
    {
      id: "hotels",
      title: "Search hotels with transparent pricing",
      subtitle: "We don't sort based on commissions",
      source: "Navio",
      imageUrl:
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&q=80",
      gradient:
        "linear-gradient(135deg, var(--planner-block-sky) 0%, var(--planner-block-blue) 100%)",
    },
    {
      id: "activities",
      title: `Top activities in ${destinationName}`,
      subtitle: "Local experiences you'll love",
      source: "Navio",
      imageUrl:
        "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=80",
      gradient:
        "linear-gradient(135deg, var(--planner-block-fuchsia) 0%, var(--planner-block-violet) 100%)",
    },
  ];
}

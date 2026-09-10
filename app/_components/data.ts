import type { LucideIcon } from "lucide-react";
import { Camera, Navigation, Users, Zap } from "lucide-react";

export type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export type Step = {
  number: string;
  title: string;
  description: string;
};

export type Stat = {
  value: string;
  label: string;
};

export const features: Feature[] = [
  {
    icon: Navigation,
    title: "Route planning",
    description:
      "Plan around EV range, charging coverage, and route timing without losing the details that matter on the road.",
  },
  {
    icon: Zap,
    title: "Charging context",
    description:
      "Compare charger stops, estimated charge time, connector details, and nearby context before committing to a route.",
  },
  {
    icon: Camera,
    title: "Trip memory",
    description:
      "Keep photos, notes, and highlights attached to the plan so finished routes are easier to revisit and share.",
  },
  {
    icon: Users,
    title: "Community routes",
    description:
      "Browse trip ideas from other drivers, copy useful plans, and discuss what worked before taking the same route.",
  },
];

export const steps: Step[] = [
  {
    number: "01",
    title: "Build the outline",
    description:
      "Choose a destination and turn it into a structured route with dates, stops, and useful trip context.",
  },
  {
    number: "02",
    title: "Check the charging fit",
    description:
      "Review charging options, timing, and connector fit before the route becomes final.",
  },
  {
    number: "03",
    title: "Save and share",
    description:
      "Save the finished plan, copy routes from Explore, and bring questions to the community feed.",
  },
];

export const stats: Stat[] = [
  { value: "50K+", label: "Charging stations" },
  { value: "120K+", label: "Routes planned" },
  { value: "15K+", label: "EV drivers" },
  { value: "98%", label: "Trip success rate" },
];

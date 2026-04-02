import type { LucideIcon } from "lucide-react"
import { Camera, Navigation, Users, Zap } from "lucide-react"

export type Feature = {
  icon: LucideIcon
  title: string
  description: string
}

export type Step = {
  number: string
  title: string
  description: string
}

export type Stat = {
  value: string
  label: string
}

export const features: Feature[] = [
  {
    icon: Navigation,
    title: "AI-Powered Route Planning",
    description:
      "Smart routing that factors in your EV range, charging network, and real-time traffic to plan the perfect trip.",
  },
  {
    icon: Zap,
    title: "Smart Charging Stops",
    description:
      "Automatically discover and reserve charging stations with live availability and estimated charge times.",
  },
  {
    icon: Camera,
    title: "Trip Media",
    description:
      "Capture and share photos and videos from your EV adventures with geo-tagged, shareable media albums.",
  },
  {
    icon: Users,
    title: "Community Routes",
    description:
      "Discover routes shared by real EV drivers and contribute your own adventures to the growing community.",
  },
]

export const steps: Step[] = [
  {
    number: "01",
    title: "Plan Your Route",
    description:
      "Enter your destination and let Navio's AI calculate the optimal EV route with charging stops automatically included.",
  },
  {
    number: "02",
    title: "Charge with Confidence",
    description:
      "Get live charging station availability, pricing, and estimated wait times — then reserve your spot ahead of time.",
  },
  {
    number: "03",
    title: "Share the Adventure",
    description:
      "Document your journey with trip media and share your route with the growing Navio EV community.",
  },
]

export const stats: Stat[] = [
  { value: "50K+", label: "Charging Stations" },
  { value: "120K+", label: "Routes Planned" },
  { value: "15K+", label: "EV Drivers" },
  { value: "98%", label: "Trip Success Rate" },
]

import type { ElementType } from "react";
import { Zap, Camera, Users, BotMessageSquare } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Feature = {
  icon: ElementType;
  title: string;
  description: string;
  accent: string;
};

const FEATURES: Feature[] = [
  {
    icon: Zap,
    title: "EV Intelligence",
    description:
      "Real-time charging station data with range anxiety elimination. Our engine calculates optimal charge stops based on your vehicle's SoC and live network availability.",
    accent: "text-chart-1",
  },
  {
    icon: Camera,
    title: "Trip & Media",
    description:
      "Capture photos, notes, and memories at every waypoint. Build rich trip albums that sync across your devices — your journey, beautifully documented.",
    accent: "text-primary",
  },
  {
    icon: Users,
    title: "Community Routes",
    description:
      "Discover crowd-sourced EV routes from fellow travellers. Upvote hidden gems, leave waypoint reviews, and build a living map of EV-friendly adventures.",
    accent: "text-chart-4",
  },
  {
    icon: BotMessageSquare,
    title: "AI Orchestrator",
    description:
      "Describe your dream trip and our AI crafts a complete itinerary — hotels, activities, charge windows, and dining — tailored to your EV's range and your preferences.",
    accent: "text-chart-3",
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="section-padding bg-muted/30">
      <div className="container-max">
        {/* Section header */}
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            Platform features
          </p>
          <h2 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            Everything your EV trip needs
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Four purpose-built services working together so you can focus on the
            road ahead.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;

  return (
    <Card className="group transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted">
          <Icon className={`size-5 ${feature.accent}`} />
        </div>
        <CardTitle className="text-xl font-bold leading-snug">
          {feature.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base leading-relaxed text-muted-foreground">
          {feature.description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}

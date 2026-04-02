import type { ElementType } from "react";
import { MapPin, Sparkles, Route } from "lucide-react";

type Step = {
  number: string;
  icon: ElementType;
  title: string;
  description: string;
};

const STEPS: Step[] = [
  {
    number: "01",
    icon: MapPin,
    title: "Set your destination",
    description:
      "Enter your origin, destination, and any must-see waypoints. Tell us your EV model and current charge level — we handle the rest.",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "Let AI plan the route",
    description:
      "Our AI Orchestrator builds a full itinerary with optimised charging stops, accommodation suggestions, and local highlights tailored to your style.",
  },
  {
    number: "03",
    icon: Route,
    title: "Hit the road",
    description:
      "Follow your live route on-device, log memories at waypoints, and share your finished trip with the community — or keep it private.",
  },
];

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="section-padding">
      <div className="container-max">
        {/* Section header */}
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            How it works
          </p>
          <h2 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            From idea to adventure in minutes
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Three steps and you're on the road. No spreadsheets, no range anxiety.
          </p>
        </div>

        {/* Steps */}
        <div className="relative grid gap-12 md:grid-cols-3">
          {/* Connector line (desktop only) */}
          <div
            aria-hidden="true"
            className="absolute left-0 right-0 top-10 hidden border-t-2 border-dashed border-border md:block"
            style={{ zIndex: 0 }}
          />

          {STEPS.map((step) => (
            <StepCard key={step.number} step={step} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCard({ step }: { step: Step }) {
  const Icon = step.icon;

  return (
    <div className="relative z-10 flex flex-col items-center text-center md:items-start md:text-left">
      {/* Number badge + icon */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex size-20 shrink-0 flex-col items-center justify-center rounded-2xl border-2 border-primary bg-background shadow-sm">
          <Icon className="size-7 text-primary" />
          <span className="mt-0.5 text-[10px] font-bold tracking-widest text-muted-foreground">
            {step.number}
          </span>
        </div>
      </div>

      <h3 className="mb-2 text-xl font-bold">{step.title}</h3>
      <p className="text-base leading-relaxed text-muted-foreground">
        {step.description}
      </p>
    </div>
  );
}

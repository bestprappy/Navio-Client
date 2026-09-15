import Link from "next/link";
import {
  ArrowRight,
  BatteryCharging,
  Clock3,
  Route,
  Zap,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button.variants";
import { cn } from "@/lib/utils";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

import { features, stats, steps } from "./_components/data";
import { FeatureCard } from "./_components/features.card";
import { HowItWorksStep } from "./_components/how-it-works.step";

const CHARGING_STOPS = ["Saraburi", "Pak Chong", "Khao Yai"] as const;

function TripPlannerMockup() {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-card shadow-xl">
      <div
        className="relative min-h-44 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(180deg, color-mix(in oklch, var(--scrim) 4%, transparent), color-mix(in oklch, var(--scrim) 58%, transparent)), url(https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80)",
        }}
      >
        <div className="absolute inset-x-0 bottom-0 p-5 text-on-media">
          <p className="text-xs font-semibold uppercase tracking-normal text-on-media/75">
            Live route preview
          </p>
          <h2 className="mt-1 text-2xl font-extrabold leading-tight">
            Bangkok to Khao Yai
          </h2>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-on-media/18 px-2.5 py-1 backdrop-blur">
              196 km
            </span>
            <span className="rounded-full bg-on-media/18 px-2.5 py-1 backdrop-blur">
              3 stops
            </span>
            <span className="rounded-full bg-on-media/18 px-2.5 py-1 backdrop-blur">
              78% range
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Drive", value: "3h 10m", icon: Route },
            { label: "Charge", value: "42m", icon: BatteryCharging },
            { label: "Depart", value: "08:30", icon: Clock3 },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-lg border border-border/70 bg-background px-3 py-2.5"
              >
                <Icon className="mb-2 size-4 text-primary" aria-hidden="true" />
                <p className="text-[11px] font-medium text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-0.5 text-sm font-bold text-foreground">
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              Charging plan
            </p>
            <span className="text-xs font-bold text-success">Ready</span>
          </div>
          <div className="space-y-2">
            {CHARGING_STOPS.map((stop, index) => (
              <div
                key={stop}
                className="flex items-center gap-3 rounded-lg border border-border/70 bg-background px-3 py-2.5"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Zap className="size-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {stop}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Stop {index + 1} - DC fast charging
                  </p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                  {index === 0 ? "18m" : "12m"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              Battery range
            </p>
            <span className="text-xs font-bold text-primary">78%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: "78%" }}
              role="progressbar"
              aria-valuenow={78}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Battery range: 78 percent"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <section className="section-padding">
          <div className="container-max grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(320px,440px)] lg:gap-20">
            <div className="flex flex-col gap-7">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary ring-1 ring-primary/15">
                <Zap className="size-3" aria-hidden="true" />
                EV trip planning for Thailand
              </span>
              <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-[3.5rem]">
                Plan routes, charging stops, and trip notes in one place.
              </h1>
              <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
                Navio helps EV drivers build practical routes, compare charging
                options, and reuse plans shared by other travelers.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className={cn(buttonVariants({ size: "lg" }), "gap-2")}
                >
                  Start planning
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/explore"
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
                >
                  Browse trips
                </Link>
              </div>
              <div className="border-t border-border/40 pt-6">
                <div className="grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:gap-x-8 sm:gap-y-4">
                  {stats.map((stat) => (
                    <div key={stat.label} className="min-w-0">
                      <p className="text-2xl font-extrabold leading-none text-foreground">
                        {stat.value}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center lg:justify-end">
              <TripPlannerMockup />
            </div>
          </div>
        </section>

        <section id="features" className="section-padding bg-muted/40">
          <div className="container-max">
            <div className="mb-12 max-w-2xl">
              <h2 className="text-3xl font-extrabold sm:text-4xl">
                Built around the trip, not just the map.
              </h2>
              <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
                Route details, chargers, media, and community context stay
                connected as the plan changes.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <FeatureCard
                  key={feature.title}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                />
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="section-padding">
          <div className="container-max">
            <div className="mb-12 max-w-2xl">
              <h2 className="text-3xl font-extrabold sm:text-4xl">
                A clearer way to prepare an EV journey.
              </h2>
              <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
                Start with a destination, refine the route, then keep the
                finished plan ready for discussion or reuse.
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-3 sm:gap-10 lg:gap-14">
              {steps.map((step) => (
                <HowItWorksStep
                  key={step.number}
                  number={step.number}
                  title={step.title}
                  description={step.description}
                />
              ))}
            </div>
          </div>
        </section>

        <section id="community" className="section-padding">
          <div className="container-max">
            <div className="grid overflow-hidden rounded-xl border border-border bg-foreground text-background shadow-xl lg:grid-cols-[1fr_0.9fr]">
              <div className="flex flex-col justify-center gap-6 p-8 sm:p-12">
                <div className="flex size-12 items-center justify-center rounded-lg bg-background/10 ring-1 ring-background/15">
                  <Zap className="size-6 text-primary" aria-hidden="true" />
                </div>
                <h2 className="max-w-2xl text-3xl font-extrabold sm:text-4xl">
                  Keep the next route easy to adjust.
                </h2>
                <p className="max-w-lg text-lg leading-relaxed text-background/75">
                  Build a trip, add stops as plans change, and bring community
                  advice into the same workspace.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/dashboard"
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "border-transparent bg-background text-foreground hover:bg-background/90 focus-visible:ring-background/50",
                    )}
                  >
                    Open planner
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                  <Link
                    href="/explore"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "border-background/25 bg-transparent text-background hover:bg-background/10 hover:text-background focus-visible:ring-background/50",
                    )}
                  >
                    Browse plans
                  </Link>
                </div>
              </div>
              <div
                className="min-h-64 bg-cover bg-center lg:min-h-full"
                style={{
                  backgroundImage:
                    "url(https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80)",
                }}
                aria-hidden="true"
              />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

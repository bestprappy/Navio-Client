import Link from "next/link"
import { ArrowRight, MapPin, Zap } from "lucide-react"

import { buttonVariants } from "@/components/ui/button.variants"
import { cn } from "@/lib/utils"

import { stats } from "./data"

const CHARGING_STOPS = ["Santa Cruz", "Monterey", "Carmel"] as const

function TripPlannerMockup() {
  return (
    <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-card shadow-xl ring-1 ring-foreground/8">
      {/* Browser chrome bar */}
      <div className="flex items-center gap-1.5 border-b border-border/40 bg-muted/60 px-4 py-3">
        <div className="size-2.5 rounded-full bg-destructive/40" aria-hidden="true" />
        <div className="size-2.5 rounded-full bg-chart-3/40" aria-hidden="true" />
        <div className="size-2.5 rounded-full bg-chart-1/40" aria-hidden="true" />
        <span className="ml-3 font-mono text-xs text-muted-foreground">
          navio.app — trip planner
        </span>
      </div>

      {/* Card content */}
      <div className="space-y-5 p-5">
        {/* Route inputs */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
            Route
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 rounded-xl bg-muted/70 px-3 py-2.5 ring-1 ring-foreground/5">
              <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="text-sm font-medium">San Francisco, CA</span>
            </div>
            <div className="flex items-center justify-center py-0.5">
              <div className="h-4 w-px bg-border/60" aria-hidden="true" />
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-muted/70 px-3 py-2.5 ring-1 ring-foreground/5">
              <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="text-sm font-medium">Big Sur, CA</span>
            </div>
          </div>
        </div>

        {/* Charging stops */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
            <Zap className="mr-1 inline size-3 text-primary" aria-hidden="true" />
            {CHARGING_STOPS.length} Charging Stops Found
          </p>
          <div className="flex flex-wrap gap-2">
            {CHARGING_STOPS.map((stop) => (
              <span
                key={stop}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-primary/15"
              >
                <Zap className="size-3" aria-hidden="true" />
                {stop}
              </span>
            ))}
          </div>
        </div>

        {/* Battery range */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
              Battery Range
            </p>
            <span className="text-xs font-bold text-primary">Sufficient ✓</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: "78%" }}
              role="progressbar"
              aria-valuenow={78}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Battery: 78% — sufficient for this route"
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 mi</span>
            <span>280 mi range</span>
          </div>
        </div>

        {/* Start button — uses a proper button element for keyboard affordance */}
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          className="w-full rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Start Navigation →
        </button>
      </div>
    </div>
  )
}

export function Hero() {
  return (
    <section className="section-padding">
      <div className="container-max grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        {/* Left: text content */}
        <div className="flex flex-col gap-7">
          {/* Badge */}
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary ring-1 ring-primary/15">
            <Zap className="size-3" aria-hidden="true" />
            AI-Powered EV Trip Planning
          </span>

          {/* Heading — size + weight + contrast hierarchy */}
          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.5rem]">
            Navigate Every{" "}
            <span className="text-primary">EV Adventure</span>
          </h1>

          {/* Subheading — muted contrast tier clearly below heading */}
          <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
            Plan EV trips with AI-optimized routes, smart charging stops, and community-driven
            insights — all in one platform built for the electric era.
          </p>

          {/* CTAs — lg size is now meaningfully larger */}
          <div className="flex flex-wrap gap-3">
            <Link
              href="/sign-up"
              className={cn(buttonVariants({ size: "lg" }), "gap-2")}
            >
              Start Planning Free
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="#how-it-works"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              See How It Works
            </Link>
          </div>

          {/* Social proof stats — separated by border, internally grouped tightly */}
          <div className="border-t border-border/40 pt-6">
            <div className="flex flex-wrap gap-x-8 gap-y-4">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col gap-0.5">
                  <p className="text-2xl font-extrabold leading-none text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: trip planner mockup */}
        <div className="flex items-center justify-center lg:justify-end">
          <TripPlannerMockup />
        </div>
      </div>
    </section>
  )
}

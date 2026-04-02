import { ArrowRight, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button.variants";
import { cn } from "@/lib/utils";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden section-padding">
      {/* Background gradient orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -top-40 left-1/2 size-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 size-[400px] rounded-full bg-accent/40 blur-3xl" />
      </div>

      <div className="container-max text-center">
        <Badge variant="secondary" className="mb-6 gap-1.5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest">
          <Zap className="size-3 text-primary" />
          Now in Beta
        </Badge>

        <h1 className="mx-auto mb-6 max-w-3xl text-5xl font-extrabold leading-tight tracking-tight md:text-6xl lg:text-7xl">
          Navigate Every{" "}
          <span className="bg-linear-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
            EV Adventure
          </span>
        </h1>

        <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          AI-powered trip planning built for electric vehicles. Smart charging
          stops, collaborative itineraries, and community-driven route discovery
          — all in one place.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" className="h-12 gap-2 px-8 text-base font-semibold">
            Start planning for free
            <ArrowRight className="size-4" />
          </Button>
          <a
            href="#how-it-works"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-12 px-8 text-base font-semibold")}
          >
            See how it works
          </a>
        </div>

        {/* Social proof */}
        <p className="mt-8 text-sm text-muted-foreground">
          Trusted by <span className="font-semibold text-foreground">500+</span> EV drivers across Thailand
        </p>

        {/* Stats row */}
        <div className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1 bg-card px-6 py-8">
              <span className="text-3xl font-extrabold text-foreground">{stat.value}</span>
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const STATS = [
  { value: "50K+", label: "Charging stops mapped" },
  { value: "120+", label: "Routes discovered" },
  { value: "98%", label: "Uptime" },
  { value: "4.9★", label: "Avg. trip rating" },
] as const;

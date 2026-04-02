import { features } from "./data"
import { FeatureCard } from "./features.card"

export function Features() {
  return (
    <section id="features" className="section-padding bg-muted/40">
      <div className="container-max">
        {/* Section header — tight internal grouping, clear contrast tiers */}
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Everything You Need for EV Travel
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            From AI route planning to community route sharing — Navio gives EV drivers the tools
            to explore with confidence.
          </p>
        </div>

        {/* 2-col on sm, 4-col on lg — wider cards with room to breathe */}
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
  )
}

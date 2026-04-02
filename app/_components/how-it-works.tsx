import { steps } from "./data"
import { HowItWorksStep } from "./how-it-works.step"

export function HowItWorks() {
  return (
    <section id="how-it-works" className="section-padding">
      <div className="container-max">
        {/* Section header */}
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Up and Running in Minutes
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Three simple steps stand between you and your next EV adventure.
          </p>
        </div>

        {/* Steps — tighter gap so the group feels connected, not isolated columns */}
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
  )
}

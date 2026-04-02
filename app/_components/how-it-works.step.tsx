import { cn } from "@/lib/utils"

type HowItWorksStepProps = {
  number: string
  title: string
  description: string
  className?: string
}

export function HowItWorksStep({
  number,
  title,
  description,
  className,
}: HowItWorksStepProps) {
  return (
    <div className={cn("flex flex-col items-start gap-4", className)}>
      {/* Step badge — tonal surface layer instead of full primary saturation.
          Keeps hierarchy: step numbers are wayfinding, not primary CTAs. */}
      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/12 ring-1 ring-primary/20">
        <span className="font-mono text-sm font-bold text-primary">{number}</span>
      </div>

      <div className="space-y-2">
        <h3 className="text-base font-semibold leading-snug text-foreground">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

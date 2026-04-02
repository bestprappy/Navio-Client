import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type FeatureCardProps = {
  icon: LucideIcon
  title: string
  description: string
  className?: string
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  className,
}: FeatureCardProps) {
  return (
    <article
      className={cn(
        // Resting state: subtle ring + card bg for clear surface separation from muted section bg
        // Hover: lift with shadow + slightly brighter ring — reinforces interactivity without color change
        "flex flex-col gap-4 rounded-2xl bg-card p-6",
        "ring-1 ring-foreground/8 shadow-sm",
        "transition-all duration-200 hover:shadow-md hover:ring-foreground/14 hover:-translate-y-0.5",
        className
      )}
    >
      {/* Icon container — tonal brand layer, not full primary saturation */}
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/12">
        <Icon className="size-5 text-primary" aria-hidden="true" />
      </div>

      {/* Text — title is foreground weight, description is muted tier */}
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold leading-snug text-foreground">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </article>
  )
}

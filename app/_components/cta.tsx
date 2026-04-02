import Link from "next/link"
import { ArrowRight, Zap } from "lucide-react"

import { buttonVariants } from "@/components/ui/button.variants"
import { cn } from "@/lib/utils"

export function CTA() {
  return (
    <section id="community" className="section-padding">
      <div className="container-max">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center sm:px-16">
          {/* Decorative blobs — increased opacity so they're visible on the primary bg */}
          <div
            className="absolute -left-16 -top-16 size-64 rounded-full bg-primary-foreground/15 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-16 -right-16 size-64 rounded-full bg-primary-foreground/15 blur-3xl"
            aria-hidden="true"
          />
          {/* Subtle top-edge highlight for depth */}
          <div
            className="absolute inset-x-0 top-0 h-px bg-primary-foreground/20"
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col items-center gap-6">
            {/* Icon badge — slightly higher contrast than before */}
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary-foreground/15 ring-1 ring-primary-foreground/25">
              <Zap className="size-7 text-primary-foreground" aria-hidden="true" />
            </div>

            {/* Heading — full-weight foreground on primary bg */}
            <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight text-primary-foreground sm:text-4xl">
              Ready to Plan Your Next EV Adventure?
            </h2>

            {/* Body — slightly muted tier below heading contrast */}
            <p className="max-w-lg text-lg leading-relaxed text-primary-foreground/85">
              Join thousands of EV drivers already using Navio to explore smarter, charge
              confidently, and share the journey.
            </p>

            {/* CTAs — use buttonVariants for consistent focus/ring system */}
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/sign-up"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  // On primary bg: invert colors — white bg, primary text
                  "bg-primary-foreground text-primary hover:bg-primary-foreground/90 focus-visible:ring-primary-foreground/50 border-transparent"
                )}
              >
                Get Started Free
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="#features"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  // Override outline to work on primary background
                  "border-primary-foreground/35 bg-transparent text-primary-foreground hover:bg-primary-foreground/12 hover:text-primary-foreground focus-visible:ring-primary-foreground/50"
                )}
              >
                Explore Features
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingCta() {
  return (
    <section
      id="cta"
      className="section-padding relative z-0 overflow-hidden bg-primary text-primary-foreground"
    >
      {/* Decorative blobs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 size-96 rounded-full bg-black/10 blur-3xl" />
      </div>

      <div className="container-max text-center">
        <h2 className="mx-auto mb-4 max-w-2xl text-4xl font-extrabold tracking-tight md:text-5xl">
          Ready to charge up your next adventure?
        </h2>
        <p className="mx-auto mb-10 max-w-lg text-lg text-primary-foreground/80">
          Join thousands of EV drivers planning smarter, driving further, and
          discovering more. It's free to get started.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            size="lg"
            variant="secondary"
            className="h-12 gap-2 px-8 text-base font-semibold"
          >
            Create your free account
            <ArrowRight className="size-4" />
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="h-12 px-8 text-base font-semibold text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
          >
            View community trips
          </Button>
        </div>

        <p className="mt-8 text-sm text-primary-foreground/60">
          No credit card required · Free forever for personal use
        </p>
      </div>
    </section>
  );
}

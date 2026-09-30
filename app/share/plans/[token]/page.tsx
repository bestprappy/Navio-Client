import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SharedPlanContent } from "@/app/feature/planner/_components/share/shared-plan-content";
import { SharedPlanHeader } from "@/app/feature/planner/_components/share/shared-plan-header";
import { fetchSharedPlan } from "@/app/feature/planner/_components/share/shared-plan-request";

export const dynamic = "force-dynamic";

/**
 * Generic on purpose. A title or destination here would be handed to every unfurl
 * service the link passes through — chat previews, link scanners, corporate
 * proxies — which would keep a copy of itinerary details the owner shared with
 * named people, and would keep it after revocation.
 */
export const metadata: Metadata = {
  title: "Shared plan · Navio",
  description: "A trip plan shared with you on Navio.",
  robots: { index: false, follow: false, nocache: true },
};

function UnavailablePage({ message }: { message: string }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold text-foreground">This shared plan is no longer available</h1>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button render={<Link href="/" />} variant="outline">
        Go to Navio
      </Button>
    </main>
  );
}

export default async function SharedPlanPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await fetchSharedPlan(token);

  // One page for every dead-link cause. Telling a visitor that a link was
  // withdrawn rather than never valid would confirm the trip exists and that
  // someone decided to stop showing it.
  if (result.status === "unavailable") {
    return (
      <UnavailablePage message="The link may have been replaced, or the owner stopped sharing this plan." />
    );
  }

  if (result.status === "error") {
    return <UnavailablePage message="Navio could not load this plan just now. Please try again shortly." />;
  }

  const { plan, publishedAt, authorName } = result.plan;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <SharedPlanHeader plan={plan} publishedAt={publishedAt} authorName={authorName} />

      <div className="py-6">
        <SharedPlanContent plan={plan} />
      </div>

      <footer className="border-t border-border pt-6">
        <p className="text-sm text-muted-foreground">
          This is a read-only copy. Changes the owner makes later stay private until they update
          this published version.
        </p>
        <Button render={<Link href="/" />} variant="outline" size="sm" className="mt-3">
          Plan your own trip with Navio
        </Button>
      </footer>
    </main>
  );
}

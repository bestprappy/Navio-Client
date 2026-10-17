import type { Metadata } from "next";
import Link from "next/link";

import SidebarWrapper from "@/components/sidebar/sidebar";
import { Button } from "@/components/ui/button";
import { SharedPlannerView } from "@/app/feature/planner/_components/share/shared-planner-view";
import { SharedPlanRetry } from "@/app/feature/planner/_components/share/shared-plan-retry";
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
      <Button nativeButton={false} role="link" render={<Link href="/" />} variant="outline">
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
    return <SharedPlanRetry />;
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden md:flex-row">
      <SidebarWrapper />
    <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
      <SharedPlannerView shared={result.plan} token={token} backLink={{ href: "/", label: "Navio" }} />
    </main>
    </div>
  );
}

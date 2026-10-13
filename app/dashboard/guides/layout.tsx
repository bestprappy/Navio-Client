import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { readAuth } from "@/auth";
import { PlannerErrorBoundary } from "@/app/feature/planner/_components/planner-error-boundary";

export default async function YourGuidesLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await readAuth();
  if (!session?.user || session.error)
    redirect("/sign-in?callbackUrl=%2Fdashboard%2Fguides");
  return (
    <PlannerErrorBoundary
      fallbackTitle="Your guides could not be displayed"
      fallbackDescription="Reload this page to try again."
    >
      {children}
    </PlannerErrorBoundary>
  );
}

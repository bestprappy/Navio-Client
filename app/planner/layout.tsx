import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getSignInHref } from "@/lib/auth-navigation";

type PlannerLayoutProps = {
  children: ReactNode;
};

export default async function PlannerLayout({ children }: PlannerLayoutProps) {
  const session = await auth();

  if (!session?.user || session.error) {
    redirect(getSignInHref("/planner"));
  }

  return <>{children}</>;
}

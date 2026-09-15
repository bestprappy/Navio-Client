import type { ReactNode } from "react";
import { GuestWelcomePrompt } from "@/app/feature/planner/_components/guest-welcome-prompt";

type PlannerLayoutProps = {
  children: ReactNode;
};

export default function PlannerLayout({ children }: PlannerLayoutProps) {
  return (
    <>
      <GuestWelcomePrompt />
      {children}
    </>
  );
}

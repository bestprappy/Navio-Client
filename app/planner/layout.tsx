import type { ReactNode } from "react";

type PlannerLayoutProps = {
  children: ReactNode;
};

export default function PlannerLayout({ children }: PlannerLayoutProps) {
  return <>{children}</>;
}

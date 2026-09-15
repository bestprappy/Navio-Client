import { redirect } from "next/navigation";

/** The trip list moved to /dashboard; keep old /planner links working. */
export default function PlannerIndexPage() {
  redirect("/dashboard");
}

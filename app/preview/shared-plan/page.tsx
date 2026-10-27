import { notFound } from "next/navigation";
import { ReaderPreview } from "@/app/feature/planner/_components/share/reader/reader-preview";

/** Full UI review data is never exposed as a real shared plan in production. */
export default function SharedPlanDesignPreview() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <ReaderPreview />;
}

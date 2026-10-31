import type { Metadata } from "next";

import { PrivacySection } from "@/app/feature/settings/_components/privacy/privacy-section";

export const metadata: Metadata = {
  title: "Privacy settings - Navio",
  description: "Profile visibility and blocked accounts.",
};

export default function PrivacySettingsPage() {
  return <PrivacySection />;
}

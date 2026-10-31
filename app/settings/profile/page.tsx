import type { Metadata } from "next";

import { ProfileSection } from "@/app/feature/settings/_components/profile/profile-section";

export const metadata: Metadata = {
  title: "Profile settings - Navio",
  description: "Your photo, banner, name, username, bio and travel preferences.",
};

export default function ProfileSettingsPage() {
  return <ProfileSection />;
}

import type { Metadata } from "next";

import { ProfileSettings } from "@/components/profile/profile-settings";

export const metadata: Metadata = {
  title: "Personal information - Navio",
  description: "Manage your personal details and account information.",
};

export default function ProfilePage() {
  return <ProfileSettings />;
}

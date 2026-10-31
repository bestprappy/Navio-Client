import type { Metadata } from "next";

import { NotificationSettings } from "@/app/feature/settings/_components/notifications/notification-settings";

export const metadata: Metadata = {
  title: "Notification settings - Navio",
  description: "Choose which in-app notifications you get.",
};

export default function NotificationSettingsPage() {
  return <NotificationSettings />;
}

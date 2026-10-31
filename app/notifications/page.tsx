import type { Metadata } from "next";

import { NotificationsPage } from "@/app/feature/notifications/notifications-page";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "Notifications - Navio",
  description: "New followers, posts and shared plans from travellers you follow.",
};

export default function NotificationsRoute() {
  return (
    <div className="min-h-svh bg-background">
      <Navbar />
      <NotificationsPage />
    </div>
  );
}

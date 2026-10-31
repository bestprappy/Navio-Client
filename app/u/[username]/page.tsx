import type { Metadata } from "next";

import { PublicProfilePage } from "@/app/feature/profile/_components/public-profile-page";
import { Navbar } from "@/components/navbar";

type PageProps = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `@${decodeURIComponent(username)} - Navio`,
    description: "A Navio traveller's public posts and shared plans.",
    robots: { index: false, follow: false },
  };
}

export default async function UserProfileRoute({ params }: PageProps) {
  const { username } = await params;
  return (
    <div className="min-h-svh bg-background">
      <Navbar />
      <PublicProfilePage username={decodeURIComponent(username)} />
    </div>
  );
}

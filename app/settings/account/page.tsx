import type { Metadata } from "next";

import { AccountSection } from "@/app/feature/settings/_components/account/account-section";
import { keycloakAccountUrl } from "@/lib/keycloak-account";

export const metadata: Metadata = {
  title: "Account settings - Navio",
  description: "Your email, username and profile link.",
};

export default function AccountSettingsPage() {
  return <AccountSection emailChangeUrl={keycloakAccountUrl("personal-info")} />;
}

import type { Metadata } from "next";
import { Suspense } from "react";

import { SettingsSkeleton } from "@/app/feature/settings/_components/settings-states";
import { SecuritySection } from "@/app/feature/settings/_components/security/security-section";
import { keycloakAccountUrl } from "@/lib/keycloak-account";

export const metadata: Metadata = {
  title: "Security settings - Navio",
  description: "Your password, sign-in methods and sessions.",
};

export default function SecuritySettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton title="Security" />}>
      <SecuritySection accountUrl={keycloakAccountUrl("account-security/signing-in")} />
    </Suspense>
  );
}

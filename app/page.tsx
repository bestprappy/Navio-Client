import { LandingNavbar } from "@/components/landing/landing.navbar";
import { LandingHero } from "@/components/landing/landing.hero";
import { LandingFeatures } from "@/components/landing/landing.features";
import { LandingHowItWorks } from "@/components/landing/landing.how-it-works";
import { LandingCta } from "@/components/landing/landing.cta";
import { LandingFooter } from "@/components/landing/landing.footer";

export default function Home() {
  return (
    <>
      <LandingNavbar />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingCta />
      </main>
      <LandingFooter />
    </>
  );
}

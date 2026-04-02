import { Footer } from "@/components/footer"
import { Navbar } from "@/components/navbar"

import { CTA } from "./_components/cta"
import { Features } from "./_components/features"
import { Hero } from "./_components/hero"
import { HowItWorks } from "./_components/how-it-works"

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <CTA />
      </main>
      <Footer />
    </>
  )
}

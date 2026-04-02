import Link from "next/link"
import { Zap } from "lucide-react"

type FooterLink = {
  label: string
  href: string
}

type FooterSection = {
  title: string
  links: FooterLink[]
}

const FOOTER_SECTIONS: FooterSection[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How It Works", href: "#how-it-works" },
      { label: "Pricing", href: "/pricing" },
      { label: "Changelog", href: "/changelog" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Docs", href: "/docs" },
      { label: "API", href: "/docs/api" },
      { label: "Community", href: "/community" },
      { label: "Status", href: "/status" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Cookies", href: "/cookies" },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-muted/20">
      <div
        className="container-max"
        style={{
          paddingInline: "var(--section-px)",
          paddingBlock: "clamp(2.5rem, 5vw, 4rem)",
        }}
      >
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-lg"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary">
                <Zap className="size-4 text-primary-foreground" aria-hidden="true" />
              </div>
              <span className="text-lg font-extrabold tracking-tight">Navio</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              AI-powered EV trip planning. Smart charging, community routes, and trip media — all
              in one platform.
            </p>
          </div>

          {/* Link columns */}
          {FOOTER_SECTIONS.map((section) => (
            <nav key={section.title} aria-label={`${section.title} links`}>
              {/* Section title — slightly higher contrast than body links */}
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground/70">
                {section.title}
              </h3>
              <ul className="space-y-3" role="list">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Bottom bar — two-tier contrast: copyright primary, tagline muted */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Navio. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/60">Built for the EV revolution.</p>
        </div>
      </div>
    </footer>
  )
}

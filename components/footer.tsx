import Link from "next/link";

import { Logo } from "@/components/logo";

type FooterLink = {
  label: string;
  href: string;
};

type FooterSection = {
  title: string;
  links: FooterLink[];
};

const FOOTER_SECTIONS: FooterSection[] = [
  {
    title: "Plan",
    links: [
      { label: "Planner", href: "/planner" },
      { label: "Explore", href: "/explore" },
      { label: "Community", href: "/community" },
    ],
  },
  {
    title: "Trips",
    links: [
      { label: "Charging stops", href: "#features" },
      { label: "How it works", href: "#how-it-works" },
      { label: "Shared routes", href: "/explore" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help", href: "/help" },
      { label: "Status", href: "/status" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

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
        <div className="grid gap-10 md:grid-cols-[1.2fr_2fr]">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                <Logo className="size-4" />
              </div>
              <span className="text-lg font-extrabold">Navio</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Practical EV trip planning with routes, chargers, notes, and
              community knowledge in the same workspace.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {FOOTER_SECTIONS.map((section) => (
              <nav key={section.title} aria-label={`${section.title} links`}>
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-normal text-foreground/70">
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
        </div>

        <div className="mt-12 flex flex-col justify-between gap-3 border-t border-border/40 pt-6 text-sm text-muted-foreground sm:flex-row">
          <p>(c) {new Date().getFullYear()} Navio. All rights reserved.</p>
          <p>Designed for EV travel in Thailand.</p>
        </div>
      </div>
    </footer>
  );
}

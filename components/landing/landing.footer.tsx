import { Navigation } from "lucide-react";

const FOOTER_LINKS = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how-it-works" },
      { label: "Community", href: "#cta" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy policy", href: "#" },
      { label: "Terms of service", href: "#" },
      { label: "Cookie policy", href: "#" },
    ],
  },
] as const;

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container-max px-(--section-px) pb-8 pt-12">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <a href="#" className="flex items-center gap-2 font-bold text-foreground">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Navigation className="size-4" />
              </span>
              <span className="text-lg tracking-tight">Navio</span>
            </a>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              AI-powered EV trip planning. Navigate further, charge smarter,
              travel together.
            </p>
          </div>

          {/* Link groups */}
          {FOOTER_LINKS.map((group) => (
            <div key={group.heading}>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-foreground">
                {group.heading}
              </h3>
              <ul className="flex flex-col gap-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Navio. Built as a university capstone project.
          </p>
          <p className="text-xs text-muted-foreground">
            Made with passion in Thailand 🇹🇭
          </p>
        </div>
      </div>
    </footer>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, IdCard, Lock, ShieldCheck, UserRound, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type SettingsLink = { href: string; label: string; hint: string; icon: LucideIcon };

export const SETTINGS_LINKS: readonly SettingsLink[] = [
  { href: "/settings/profile", label: "Profile", hint: "Photo, banner and what others see", icon: UserRound },
  { href: "/settings/account", label: "Account", hint: "Email, username and sign-in account", icon: IdCard },
  { href: "/settings/security", label: "Security", hint: "Password and sessions", icon: ShieldCheck },
  { href: "/settings/notifications", label: "Notifications", hint: "What Navio tells you about", icon: Bell },
  { href: "/settings/privacy", label: "Privacy", hint: "Visibility and blocked accounts", icon: Lock },
];

/**
 * Settings navigation. A labelled rail beside the content on wide screens; a
 * horizontally scrolling bar pinned under the navbar on phones, so every
 * section stays one tap away without a second menu.
 */
export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Settings" className="min-w-0 md:sticky md:top-24 md:self-start">
      <ul
        role="list"
        className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-col md:overflow-visible md:px-0 md:pb-0"
      >
        {SETTINGS_LINKS.map(({ href, label, hint, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex min-h-11 items-center gap-3 rounded-[var(--card-radius-sm,0.75rem)] px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  active
                    ? "bg-card font-semibold text-foreground shadow-xs ring-1 ring-border"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                )}
              >
                <Icon aria-hidden="true" className={cn("size-4 shrink-0", active && "text-primary")} />
                <span className="flex flex-col">
                  <span>{label}</span>
                  <span className="hidden text-xs font-normal text-muted-foreground md:block">{hint}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { ArrowLeft, Bell, Building2, Plug, ShieldCheck, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SETTINGS_ITEMS = [
  { value: "personal-info", label: "Personal Info", icon: UserRound, available: true },
  { value: "security", label: "Security", icon: ShieldCheck, available: false },
  { value: "notifications", label: "Notifications", icon: Bell, available: false },
  { value: "organization", label: "Organization", icon: Building2, available: false },
  { value: "integrations", label: "Integrations", icon: Plug, available: false },
] as const;

export function SettingsSidebar() {
  return (
    <aside className="flex w-full shrink-0 flex-col gap-6 lg:sticky lg:top-24 lg:w-60 lg:self-start xl:w-64">
      <Link href="/planner" className="flex w-fit items-center gap-2 rounded-sm text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
        <ArrowLeft aria-hidden="true" className="size-3.5" />
        Back to your trips
      </Link>

      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Account settings</h2>
        <p className="text-sm text-muted-foreground">A little more about you.</p>
      </div>

      <nav aria-label="Account settings" className="hidden lg:block">
        <ul className="flex flex-col gap-1">
          {SETTINGS_ITEMS.map(({ value, label, icon: Icon, available }) => (
            <li key={value}>
              {available ? (
                <Link href="/settings/profile" aria-current="page" className="flex min-h-11 items-center gap-3 rounded-[var(--btn-radius)] bg-primary/10 px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-primary/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                  <Icon aria-hidden="true" className="size-4 text-primary" />
                  {label}
                </Link>
              ) : (
                <Button type="button" variant="ghost" disabled className="h-11 w-full justify-start gap-3 rounded-[var(--btn-radius)] px-4 text-sm font-normal text-muted-foreground disabled:opacity-70">
                  <Icon aria-hidden="true" className="size-4" />
                  {label}
                  <span className="ml-auto rounded-md bg-muted px-1.5 py-0.5 text-[0.625rem] font-medium">Soon</span>
                </Button>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <div className="lg:hidden">
        <Select value="personal-info">
          <SelectTrigger aria-label="Account settings navigation" className="w-full rounded-[var(--btn-radius)] bg-card px-4 data-[size=default]:h-11">
            <UserRound aria-hidden="true" className="size-4 text-primary" />
            <SelectValue>Personal Info</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {SETTINGS_ITEMS.map(({ value, label, icon: Icon, available }) => (
              <SelectItem key={value} value={value} disabled={!available}>
                <Icon aria-hidden="true" className="size-4" />
                {label}{available ? "" : " · Soon"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="hidden border-t border-border/70 pt-5 text-xs leading-relaxed text-muted-foreground lg:block">
        Your details, ready for wherever<br />the next journey takes you.
      </p>
    </aside>
  );
}

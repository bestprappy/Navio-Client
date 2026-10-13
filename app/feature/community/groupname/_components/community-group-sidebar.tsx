"use client";

import type { ReactNode } from "react";
import { CalendarDays, Globe2, MapPin } from "lucide-react";

import type { CommunityGroup, CommunityGroupProfile } from "../../_components/data";
import { formatCount } from "../../_components/data";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { CommunityFlairBadge } from "../../_components/community-flair-badge";
import { CommunityUserLabel } from "../../_components/community-user-label";
import { communityHandle } from "../../_components/community-identity";

type CommunityGroupSidebarProps = {
  group: CommunityGroup;
  profile: CommunityGroupProfile;
  createdAt?: string;
};

function Section({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("border-t border-border px-4 py-4", className)}>
      <h3 className="mb-2.5 text-sm font-bold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

function formatCreated(value?: string) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })
    : null;
}

/** The community's About card: purpose, facts, then rules, flairs, resources and moderators. */
export function CommunityGroupSidebar({ group, profile, createdAt }: CommunityGroupSidebarProps) {
  const moderators = Array.from(new Set(profile.moderatorIds));
  const created = formatCreated(createdAt);
  const where = [group.country, ...group.places].filter(Boolean);

  return (
    <aside aria-label={`About ${group.name}`} className="flex min-w-0 flex-col">
      <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/70">
        <div className="px-4 pb-4 pt-4">
          <h2 className="truncate text-base font-extrabold text-foreground">{communityHandle(group.slug, group.name)}</h2>
          <p className="mt-1.5 whitespace-pre-line break-words text-sm leading-6 text-muted-foreground">
            {profile.summary || group.description}
          </p>

          <dl className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <dt className="text-xs text-muted-foreground">Members</dt>
              <dd className="text-lg font-extrabold tabular-nums text-foreground">{formatCount(group.memberCount)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Posts</dt>
              <dd className="text-lg font-extrabold tabular-nums text-foreground">{formatCount(group.postCount)}</dd>
            </div>
          </dl>

          <ul className="mt-4 flex flex-col gap-2 text-xs text-muted-foreground">
            {created ? (
              <li className="flex items-center gap-2">
                <CalendarDays className="size-3.5" aria-hidden="true" />
                Created {created}
              </li>
            ) : null}
            <li className="flex items-center gap-2">
              <Globe2 className="size-3.5" aria-hidden="true" />
              Public: anyone can read, members can post
            </li>
            {where.length ? (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                <span className="break-words">{where.join(", ")}</span>
              </li>
            ) : null}
          </ul>

          {group.tags.length ? (
            <ul aria-label="Topics" className="mt-4 flex flex-wrap gap-1.5">
              {group.tags.map((tag) => (
                <li key={tag} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {group.rules.length ? (
          <Section title="Rules">
            <Accordion
              key={group.rules.map((rule) => rule.id).join("|")}
              defaultValue={[]}
              className="gap-0"
            >
              {group.rules.map((rule, index) => (
                <AccordionItem key={rule.id} value={rule.id} className="border-b-0">
                  <AccordionTrigger className="gap-3 px-0 py-2 hover:no-underline">
                    <span className="w-4 shrink-0 text-sm tabular-nums text-muted-foreground">{index + 1}</span>
                    <span className="text-sm font-medium text-foreground">{rule.title}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pl-7 text-muted-foreground">{rule.description}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Section>
        ) : null}

        {group.postFlairs.length ? (
          <Section title="Post flair">
            <ul className="flex flex-wrap gap-2">
              {group.postFlairs.map((flair) => (
                <li key={flair.id}>
                  <CommunityFlairBadge flair={flair} />
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {group.bookmarks.length ? (
          <Section title="Resources">
            <ul className="flex flex-col gap-2 text-sm">
              {group.bookmarks.map((resource) => (
                <li key={resource.id}>
                  {resource.url && /^https?:\/\//.test(resource.url) ? (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-words font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {resource.label}
                    </a>
                  ) : (
                    resource.label
                  )}
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        <Section title="Moderators">
          {moderators.length ? (
            <ul className="flex flex-col gap-2.5">
              {moderators.map((id) => (
                <li key={id}>
                  <CommunityUserLabel userId={id} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No moderators listed.</p>
          )}
        </Section>
      </div>
    </aside>
  );
}

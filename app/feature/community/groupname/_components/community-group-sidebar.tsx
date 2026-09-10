"use client";

import type { ReactNode } from "react";
import { CalendarDays, Globe2, TrendingUp, Users } from "lucide-react";

import type {
  CommunityGroup,
  CommunityGroupProfile,
} from "../../_components/data";
import { formatCount, getInitials } from "../../_components/data";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CommunityFlairBadge } from "../../_components/community-flair-badge";
import { CommunityUserLabel } from "../../_components/community-user-label";

type CommunityGroupSidebarProps = {
  group: CommunityGroup;
  profile: CommunityGroupProfile;
};

function SidebarSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border-t border-border px-4 py-4", className)}>
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function CommunityGroupSidebar({
  group,
  profile,
}: CommunityGroupSidebarProps) {
  const moderators = Array.from(new Set(profile.moderatorIds));

  return (
    <aside
      aria-label={`${group.name} sidebar`}
      className={cn(
        "flex min-h-0 flex-col gap-4",
        "xl:sticky xl:top-6 xl:self-start",
        "xl:max-h-[calc(100dvh-8rem)]",
      )}
    >
      <Card
        className={cn(
          "gap-0 py-0",
          "xl:max-h-[calc(100dvh-8rem)] xl:overflow-y-auto xl:overscroll-contain",
          "xl:[scrollbar-width:none] xl:[-ms-overflow-style:none]",
          "xl:[&::-webkit-scrollbar]:hidden",
        )}
      >
        <CardHeader className="px-4 py-4">
          <CardTitle>{group.name}</CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            {profile.summary}
          </p>

          <div className="mt-2 flex flex-col gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <CalendarDays className="size-3.5" aria-hidden="true" />
              Created for {group.country} planning
            </span>
            <span className="flex items-center gap-2">
              <Globe2 className="size-3.5" aria-hidden="true" />
              Public community
            </span>
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="flex items-center gap-1 text-lg font-extrabold text-foreground">
                <Users
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                {formatCount(profile.weeklyVisitorCount)}
              </p>
              <p className="text-xs text-muted-foreground">Weekly visitors</p>
            </div>
            <div>
              <p className="flex items-center gap-1 text-lg font-extrabold text-foreground">
                <TrendingUp
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                {formatCount(profile.weeklyContributionCount)}
              </p>
              <p className="text-xs text-muted-foreground">
                Weekly contributions
              </p>
            </div>
          </div>
        </CardContent>

        <SidebarSection title="Post flair">
          {group.postFlairs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No post flairs yet.</p>
          ) : null}
          <div className="flex flex-wrap gap-2" role="list">
            {group.postFlairs.map((flair) => (
              <span key={flair.id} role="listitem">
                <CommunityFlairBadge flair={flair} />
              </span>
            ))}
          </div>
        </SidebarSection>

        <SidebarSection title="Rules">
          {group.rules.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rules added yet.</p>
          ) : null}
          <Accordion
            key={group.rules.map((rule) => rule.id).join("|")}
            defaultValue={group.rules[0] ? [group.rules[0].id] : []}
            className="gap-1"
          >
            {group.rules.map((rule, index) => (
              <AccordionItem
                key={rule.id}
                value={rule.id}
                className="border-b-0"
              >
                <AccordionTrigger className="gap-3 px-0 py-2 hover:no-underline">
                  <span className="w-5 shrink-0 text-sm text-muted-foreground">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {rule.title}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pl-8 text-muted-foreground">
                  {rule.description}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </SidebarSection>

        <SidebarSection title="Resources">
          <ul className="space-y-2 text-sm">
            {group.bookmarks.map((resource) => (
              <li key={resource.id}>
                {resource.url && /^https?:\/\//.test(resource.url) ? (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-words text-primary underline underline-offset-4"
                  >
                    {resource.label}
                  </a>
                ) : (
                  resource.label
                )}
              </li>
            ))}
          </ul>
          {group.bookmarks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No resources yet.</p>
          ) : null}
        </SidebarSection>
        <SidebarSection title="Moderators" className="pb-4">
          <div className="space-y-3">
            {moderators.map((id) => (
              <div key={id} className="flex min-w-0 items-center gap-3">
                <Avatar className="size-9 shrink-0">
                  <AvatarFallback>{getInitials(id)}</AvatarFallback>
                </Avatar>
                <CommunityUserLabel userId={id} />
              </div>
            ))}
            {moderators.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No moderators listed.
              </p>
            ) : null}
          </div>
        </SidebarSection>
      </Card>
    </aside>
  );
}

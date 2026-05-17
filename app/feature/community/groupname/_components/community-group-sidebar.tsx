"use client";

import type { ReactNode } from "react";
import { CalendarDays, Globe2, Mail, TrendingUp, Users } from "lucide-react";

import type {
  CommunityGroup,
  CommunityGroupProfile,
} from "../../_components/data";
import { formatCount, getInitials, getUserById } from "../../_components/data";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CommunityFlairBadge } from "../../_components/community-flair-badge";

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
  const moderators = Array.from(new Set(profile.moderatorIds)).map((id) =>
    getUserById(id),
  );

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
          <div className="flex flex-wrap gap-2" role="list">
            {group.postFlairs.map((flair) => (
              <span key={flair.id} role="listitem">
                <CommunityFlairBadge flair={flair} />
              </span>
            ))}
          </div>
        </SidebarSection>

        <SidebarSection title="Rules">
          <Accordion
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

        <SidebarSection title="Moderators" className="pb-4">
          <Button
            type="button"
            variant="secondary"
            className="mb-4 w-full rounded-full"
          >
            <Mail className="size-4" aria-hidden="true" />
            Message mods
          </Button>

          <div className="space-y-3">
            {moderators.map((moderator, index) => {
              const flair = group.userFlairs[index % group.userFlairs.length];

              return (
                <div key={moderator.id} className="flex items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarImage
                      src={moderator.avatarUrl}
                      alt={moderator.name}
                    />
                    <AvatarFallback className="text-[11px]">
                      {getInitials(moderator.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      @{moderator.handle}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {flair ? (
                        <CommunityFlairBadge
                          flair={flair}
                          className="h-4 px-1.5 text-[10px]"
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </SidebarSection>
      </Card>
    </aside>
  );
}

"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { CommunityGroup } from "../_components/data";
import { mockCommunityGroupProfiles } from "../_components/data";

type CommunityRulesSidebarProps = {
  group: CommunityGroup;
};

export function CommunityRulesSidebar({ group }: CommunityRulesSidebarProps) {
  const profile = mockCommunityGroupProfiles.find(
    (p) => p.groupId === group.id,
  );

  return (
    <aside className="flex flex-col gap-4" aria-label="Community information">
      {profile && (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-info">
            From the mods of {group.name}
          </p>
          <p className="text-sm leading-relaxed text-foreground/90">
            {profile.summary}
          </p>
        </div>
      )}

      {group.rules.length > 0 && (
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-info">
            {group.name} Rules
          </p>
          <Accordion>
            {group.rules.map((rule, index) => (
              <AccordionItem key={rule.id} value={rule.id}>
                <AccordionTrigger className="gap-3 py-2.5 hover:no-underline">
                  <span className="w-5 shrink-0 text-left text-sm font-semibold tabular-nums text-info">
                    {index + 1}
                  </span>
                  <span className="text-sm text-foreground">{rule.title}</span>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="pl-8 text-sm text-muted-foreground">
                    {rule.description}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}
    </aside>
  );
}

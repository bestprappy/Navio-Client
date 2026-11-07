'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { NAVIO_MENU, isNavioNavActive } from '../community-navigation';

export function CommunityNavioMenu() {
  const pathname = usePathname();
  return <nav aria-label="Navio navigation" className="border-b border-sidebar-border px-3 pt-4 pb-3">
    <Accordion defaultValue={[]}>
      <AccordionItem value="navio-menu" className="border-none">
        <AccordionTrigger className="min-h-10 px-3 text-xs font-semibold text-muted-foreground hover:bg-muted hover:no-underline">
          Navio menu
        </AccordionTrigger>
        <AccordionContent className="pb-0 [&_a]:no-underline">
          <ul className="flex flex-col gap-1 pt-1">
            {NAVIO_MENU.map(({ title, href, icon: Icon }) => {
              const active = isNavioNavActive(pathname, href);
              return <li key={href}><Link href={href} aria-current={active ? 'page' : undefined}
                className={cn('flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active ? 'bg-sidebar-accent font-semibold text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                <Icon aria-hidden="true" className={cn('size-5 shrink-0', active && 'text-primary')} />{title}
              </Link></li>;
            })}
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </nav>;
}

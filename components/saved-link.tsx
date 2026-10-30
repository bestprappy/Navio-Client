"use client";
import Link from 'next/link';
import {Bookmark} from 'lucide-react';
import {usePathname} from 'next/navigation';
import {cn} from '@/lib/utils';
export function SavedLink({label=false,className,onNavigate}:{label?:boolean;className?:string;onNavigate?:()=>void}){
 const active=usePathname()==='/saved';
 return <Link href="/saved" aria-label="Saved" title="Saved" aria-current={active?'page':undefined} onClick={onNavigate}
  className={cn('inline-flex min-h-9 min-w-9 shrink-0 items-center justify-center gap-2 rounded-full px-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',active&&'bg-primary/10 text-primary',label&&'justify-start px-3',className)}><Bookmark className={cn('size-4 shrink-0',active&&'fill-current')} aria-hidden="true"/>{label&&<span>Saved</span>}</Link>;
}

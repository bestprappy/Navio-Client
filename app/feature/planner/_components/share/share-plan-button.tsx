'use client';
import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SharedLinkField } from './shared-link-field';
import { Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle,DialogTrigger } from '@/components/ui/dialog';
/** Shared by Explore cards and the reader so URL/copy behavior stays identical. */
export function SharePlanButton({token,className}:{token:string;className?:string}){
  const [open,setOpen]=useState(false);
  const [url,setUrl]=useState('');
  return <Dialog open={open} onOpenChange={value=>{if(value)setUrl(new URL(`/share/plans/${encodeURIComponent(token)}`,window.location.origin).href);setOpen(value);}}>
    <DialogTrigger aria-label="Share plan" title="Share plan" className={cn('inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',className)}><Share2 className="size-4" aria-hidden="true"/></DialogTrigger>
    <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Share this plan</DialogTitle><DialogDescription>Send the published plan to someone planning their next trip.</DialogDescription></DialogHeader><SharedLinkField url={url}/></DialogContent>
  </Dialog>;
}

"use client";
import {useState,type ReactNode} from "react";
import {Bookmark,ChevronDown} from "lucide-react";
import {Navbar} from "@/components/navbar";

export function SavedLayout({header,navigation,children}:{header:ReactNode;navigation:ReactNode;children:ReactNode}){
 const [expanded,setExpanded]=useState(false);
 return <div className="fixed inset-0 flex min-h-0 flex-col overflow-hidden bg-background">
  <div className="relative z-50 shrink-0"><Navbar/></div>
  <div className="flex min-h-0 flex-1 flex-col md:flex-row">
   <aside aria-label="Saved navigation" className="z-20 flex min-h-0 shrink-0 flex-col border-b border-border/60 bg-card md:w-56 md:border-r md:border-b-0 lg:w-60">
    <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-5 py-4">
     <span className="flex items-center gap-2 font-semibold"><Bookmark className="size-4 text-primary"/>Saved</span>
     <button type="button" aria-label="Toggle saved navigation" aria-expanded={expanded} aria-controls="saved-navigation" onClick={()=>setExpanded(!expanded)} className="flex size-9 items-center justify-center rounded-lg hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring md:hidden"><ChevronDown className={expanded?'size-4 rotate-180':'size-4'}/></button>
    </div>
    <div id="saved-navigation" className={`${expanded?'block':'hidden'} max-h-[45dvh] overflow-y-auto overscroll-contain p-3 [scrollbar-gutter:stable] md:block md:max-h-none md:flex-1`}>{navigation}</div>
   </aside>
   <main id="saved-main" className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
    <div className="mx-auto w-full max-w-7xl px-5 py-7 sm:px-8 sm:py-10">{header}{children}</div>
   </main>
  </div>
 </div>;
}

"use client";
import {useSearchParams} from "next/navigation";
import Link from "next/link";
import {ArrowBigUp,ArrowBigDown,Bookmark,History,MessageSquare,ThumbsUp} from "lucide-react";
import {Accordion,AccordionItem,AccordionTrigger,AccordionContent} from "@/components/ui/accordion";
import {cn} from "@/lib/utils";
import {parseSavedSearch,savedSearchParams,savedTabs} from "./library-model";
const labels={recents:"Recents",all:"All",plans:"Plans",guides:"Guides",places:"Places",trash:"Recently Deleted"};
const community=[{value:"saved",label:"Saved Posts",icon:Bookmark},{value:"voted",label:"Voted Posts",icon:ThumbsUp},{value:"history",label:"History",icon:History},{value:"comments",label:"Comment History",icon:MessageSquare}] as const;
const row="flex min-h-10 w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
export function SavedNavigation(){
 const params=useSearchParams(),state=parseSavedSearch(params),isCommunity=params.get("section")==="community",view=params.get("view")??"saved",vote=params.get("vote")??"all";
 const communityHref=(next:string,vote="all")=>{const query=new URLSearchParams(params);query.set("section","community");query.set("view",next);query.set("vote",vote);query.delete("communityPage");return `/saved?${query}`;};
 const exploreHref=(tab:typeof state.tab)=>{const query=new URLSearchParams(params);for(const [key,value] of savedSearchParams({...state,tab,page:0}))query.set(key,value);query.set("tab",tab);query.delete("section");query.delete("page");return `/saved?${query}`;};
 return <nav aria-label="Saved collections"><Accordion multiple defaultValue={["explore","community"]}>
 <AccordionItem value="explore" className="border-none"><AccordionTrigger className="px-3 text-sm font-bold text-foreground hover:no-underline">Explore</AccordionTrigger><AccordionContent className="pb-3 [&_a]:no-underline">
 {savedTabs.map(tab=><Link key={tab} href={exploreHref(tab)} scroll={false} aria-current={!isCommunity&&state.tab===tab?"page":undefined} className={cn(row,!isCommunity&&state.tab===tab?"bg-foreground text-background":"text-muted-foreground hover:bg-muted")}>{labels[tab]}</Link>)}
 </AccordionContent></AccordionItem>
 <AccordionItem value="community" className="border-t border-border/60"><AccordionTrigger className="px-3 text-sm font-bold text-foreground hover:no-underline">Community</AccordionTrigger><AccordionContent className="pb-2 [&_a]:no-underline">
 {community.map(({value,label,icon:Icon})=><div key={value}><Link scroll={false} href={communityHref(value)} aria-current={isCommunity&&view===value?"page":undefined} className={cn(row,isCommunity&&view===value?"bg-foreground text-background":"text-muted-foreground hover:bg-muted")}><Icon className="size-4 shrink-0"/>{label}</Link>
 {value==="voted"&&isCommunity&&view==="voted"&&<div className="ml-4 mt-1 space-y-1 border-l border-border pl-2">{[{value:"all",label:"All",icon:ThumbsUp},{value:"up",label:"Upvoted",icon:ArrowBigUp},{value:"down",label:"Downvoted",icon:ArrowBigDown}].map(({value,label,icon:VoteIcon})=><Link key={value} scroll={false} href={communityHref("voted",value)} aria-current={vote===value?"page":undefined} className={cn(row,"text-xs",vote===value?"bg-primary/10 text-primary":"text-muted-foreground hover:bg-muted")}><VoteIcon className="size-4"/>{label}</Link>)}</div>}</div>)}
 </AccordionContent></AccordionItem></Accordion></nav>;
}

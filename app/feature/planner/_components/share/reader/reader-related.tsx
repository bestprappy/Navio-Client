"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { fetchExplorePlansPage } from "@/app/feature/explore/_components/shared-plans/explore-plans-api";
import { SharedPlanCard } from "@/app/feature/explore/_components/shared-plans/shared-plan-card";
import type { PublicPlanSnapshot } from "../publication-api";
import { rankRelatedPlans } from "./reader-model";
import { ReaderSection, readerButton } from "./reader-ui";

export function ReaderRelated({ token,plan }: { token:string;plan:PublicPlanSnapshot }) {
  const query=useQuery({queryKey:["explore","shared-plans","reader-related",48],queryFn:({signal})=>fetchExplorePlansPage(0,signal,"recent",48),staleTime:60_000,retry:1});
  const related=rankRelatedPlans(query.data?.content??[],token,plan);
  return <ReaderSection id="reader-related" eyebrow="Keep exploring" title="Related shared plans" action={<Link href="/explore" className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-primary">Explore all<ArrowUpRight className="size-3.5" /></Link>}>
    {query.isLoading ? <div className="grid grid-cols-2 gap-3">{[0,1].map(n=><div key={n} className="h-56 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none" />)}</div>
      : query.isError ? <div className="rounded-xl border border-border p-4 text-sm"><p className="mb-3 text-muted-foreground">Related plans could not be loaded.</p><button type="button" className={readerButton} onClick={()=>void query.refetch()}>Try again</button></div>
      : related.length ? <div className="grid gap-4 @lg/planner:grid-cols-2">{related.map(p=><SharedPlanCard key={p.token} plan={p} />)}</div>
      : <p className="rounded-xl border border-border/60 bg-card p-4 text-sm leading-6 text-muted-foreground">No other plans for this destination are listed yet. <Link href="/explore" className="font-medium text-primary underline underline-offset-4">Find your next trip</Link>.</p>}
  </ReaderSection>;
}

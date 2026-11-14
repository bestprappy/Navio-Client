'use client';
import { useSession } from 'next-auth/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { feedbackRequest,feedbackSummarySchema } from './feedback-api';
export function usePlanFeedback(token?:string,enabled=true){
  const session=useSession();
  const user=session.data?.error?null:session.data?.user;
  const identity=user?.id??'guest';
  const client=useQueryClient();
  const key=['plan-feedback',token,identity] as const;
  const summary=useQuery({queryKey:[...key,'summary'],enabled:!!token&&enabled&&session.status!=='loading',
    queryFn:async({signal})=>feedbackSummarySchema.parse(await feedbackRequest(token!,'',{signal})),staleTime:15_000,retry:1});
  async function refresh(){await client.cancelQueries({queryKey:[...key,'summary']});await Promise.all([client.invalidateQueries({queryKey:['plan-feedback',token]}),client.invalidateQueries({queryKey:['explore','shared-plans']}),client.invalidateQueries({queryKey:['explore-plan-search']}),...(token?.startsWith('guide:')?[client.invalidateQueries({queryKey:['guide-discovery']})]:[])]);}
  return {summary,user,identity,key,refresh,sessionLoading:session.status==='loading'};
}

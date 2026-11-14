'use client';
import {usePublicationRead} from '@/hooks/use-publication-read';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {useSession} from 'next-auth/react';
import {ReaderStatistics} from '@/components/reader-statistics';
import {useFavoriteCount} from '../saved/favorite-count';
import {guideIdentity} from '../saved/library-model';
import {z} from 'zod';
import {Button} from '@/components/ui/button';
import {feedbackRequest,feedbackSummarySchema} from '../planner/_components/share/feedback/feedback-api';
export const guideEngagementSchema=feedbackSummarySchema.extend({viewCount:z.number().int().nonnegative(),uniqueViewCount:z.number().int().nonnegative()});
export function GuideEngagement({source,id}:{source:'CURATED'|'TRAVELER';id:string}){
 const session=useSession(),client=useQueryClient();
 const token=`guide:${source}:${id}`,identity=session.data?.error?'guest':session.data?.user?.id??'guest';
 const query=useQuery({queryKey:['plan-feedback',token,identity,'engagement'],enabled:session.status!=='loading',queryFn:async({signal})=>guideEngagementSchema.parse(await feedbackRequest(token,'',{signal})),staleTime:15000,retry:1});
 const {failed,retry}=usePublicationRead({url:`/api/traveler-guides/discovery/${source}/${encodeURIComponent(id)}/view`,identity,loading:session.status==='loading',onRecorded:async()=>{await client.cancelQueries({queryKey:['plan-feedback',token,identity,'engagement']});await Promise.all([client.invalidateQueries({queryKey:['guide-discovery']}),client.invalidateQueries({queryKey:['plan-feedback',token]})]);}});
 const data=query.data;
 const favorites=useFavoriteCount(guideIdentity(id,source));
 return <div className="space-y-2" aria-label="Guide readership and rating">
  <ReaderStatistics {...data} favoriteCount={favorites.data}/>
  {(failed||query.isError)&&<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground" role="status"><span>Readership statistics could not be refreshed.</span><Button size="sm" variant="ghost" onClick={()=>{retry();void query.refetch();}}>Retry</Button></div>}
 </div>;
}

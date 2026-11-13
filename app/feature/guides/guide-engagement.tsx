'use client';
import {useEffect,useRef,useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {useSession} from 'next-auth/react';
import {Eye,Users,Star} from 'lucide-react';
import {z} from 'zod';
import {Button} from '@/components/ui/button';
import {feedbackRequest,feedbackSummarySchema} from '../planner/_components/share/feedback/feedback-api';
export const guideEngagementSchema=feedbackSummarySchema.extend({viewCount:z.number().int().nonnegative(),uniqueViewCount:z.number().int().nonnegative()});
export function GuideEngagement({source,id}:{source:'CURATED'|'TRAVELER';id:string}){
 const session=useSession(),client=useQueryClient(),readId=useRef<string|null>(null),recorded=useRef(false);
 const [failed,setFailed]=useState(false),[retry,setRetry]=useState(0);
 const token=`guide:${source}:${id}`,identity=session.data?.error?'guest':session.data?.user?.id??'guest';
 const query=useQuery({queryKey:['plan-feedback',token,identity,'engagement'],enabled:session.status!=='loading',queryFn:async({signal})=>guideEngagementSchema.parse(await feedbackRequest(token,'',{signal})),staleTime:15000,retry:1});
 useEffect(()=>{
  if(session.status==='loading'||recorded.current)return;
  const record=()=>{
   if(document.visibilityState!=='visible'||recorded.current)return;
   recorded.current=true;readId.current??=crypto.randomUUID();
   void fetch(`/api/traveler-guides/discovery/${source}/${encodeURIComponent(id)}/view`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({readId:readId.current}),keepalive:true})
    .then(async response=>{if(!response.ok)throw new Error('View not recorded');await Promise.all([client.invalidateQueries({queryKey:['guide-discovery']}),client.invalidateQueries({queryKey:['plan-feedback',token]})]);setFailed(false);})
    .catch(()=>{recorded.current=false;setFailed(true);});
  };
  record();document.addEventListener('visibilitychange',record);
  return()=>{document.removeEventListener('visibilitychange',record);};
 },[client,id,source,token,session.status,retry]);
 const data=query.data;
 return <div className="space-y-2 rounded-xl border border-border/60 bg-card px-4 py-3" aria-label="Guide readership and rating">
  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground" aria-live="polite">
   <span className="inline-flex items-center gap-2"><Eye className="size-4" aria-hidden="true"/>{data?`${data.viewCount.toLocaleString()} total views`:'Loading views…'}</span>
   <span className="inline-flex items-center gap-2" title="Each signed-in account counts once. Tracking began with this feature."><Users className="size-4" aria-hidden="true"/>{data?`${data.uniqueViewCount.toLocaleString()} unique signed-in viewers`:'— unique viewers'}</span>
   <a href="#reader-feedback" className="inline-flex items-center gap-2 hover:text-primary"><Star className="size-4 text-rating" aria-hidden="true"/>{data?.ratingAverage?`${data.ratingAverage.toFixed(1)} (${data.ratingCount} ratings)`:'Not rated yet'}</a>
  </div>
  {(failed||query.isError)&&<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground" role="status"><span>Readership statistics could not be refreshed.</span><Button size="sm" variant="ghost" onClick={()=>{setRetry(n=>n+1);void query.refetch();}}>Retry</Button></div>}
 </div>;
}

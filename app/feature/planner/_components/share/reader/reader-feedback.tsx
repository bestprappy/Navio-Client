"use client";
import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';
import { ReaderSection } from './reader-ui';
import { usePlanFeedback } from '../feedback/use-plan-feedback';
import { FeedbackRating } from '../feedback/feedback-rating';
import { FeedbackComposer } from '../feedback/feedback-composer';
import { FeedbackComments,FeedbackReports } from '../feedback/feedback-comments';

export function ReaderFeedback({token,listed=false}:{token?:string;listed?:boolean}) {
  const {summary,user,identity,refresh,sessionLoading}=usePlanFeedback(token,listed);
  const data=summary.data;
  if(!token||!listed)return null;
  return <ReaderSection id="reader-feedback" eyebrow="Traveler feedback" title="Ratings & conversation">
    {summary.isError&&!data?<div role="alert" className="space-y-3 rounded-xl border border-border p-4"><p className="text-sm">Feedback is temporarily unavailable. Your trip plan is still available to read.</p><Button size="sm" variant="outline" onClick={()=>void summary.refetch()}>Try again</Button></div>:sessionLoading||!data?<p role="status" className="text-sm text-muted-foreground">Loading traveler feedback…</p>:<>
      {summary.isError&&<div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground"><span>Feedback could not be refreshed. Your draft is still here.</span><Button size="sm" variant="outline" onClick={()=>void summary.refetch()}>Try again</Button></div>}
      <FeedbackRating key={identity} token={token} summary={data} signedIn={!!user} onSaved={refresh}/>
      {!user&&<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/40 p-4"><p className="text-sm text-muted-foreground">Sign in to rate this plan or join the conversation.</p><Button size="sm" onClick={()=>void signIn('keycloak',{redirectTo:window.location.href})}>Sign in</Button></div>}
      <div className="space-y-5 rounded-2xl border border-border/60 bg-card p-5"><h3 className="font-semibold">Questions & thoughts <span className="font-normal text-muted-foreground">({data.commentCount})</span></h3>
        {user&&<FeedbackComposer key={identity} token={token} name={user.name} onSaved={refresh}/>}
        <FeedbackComments key={identity} token={token} identity={identity} signedIn={!!user} name={user?.name} refresh={refresh}/>
      </div>
      {data.publisher&&<FeedbackReports token={token} identity={identity} refresh={refresh}/>}</>}
  </ReaderSection>;
}

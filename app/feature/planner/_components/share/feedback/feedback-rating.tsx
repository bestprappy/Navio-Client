'use client';
import { useMutation } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { feedbackRequest,type FeedbackSummary } from './feedback-api';
export function FeedbackRating({token,summary,signedIn,onSaved}:{token:string;summary:FeedbackSummary;signedIn:boolean;onSaved:()=>Promise<void>}){
  const kind=token.startsWith('guide:')?'guide':'plan';
  const mutation=useMutation({mutationFn:(score:number|null)=>feedbackRequest(token,'rating',score===null?{method:'DELETE'}:{method:'PUT',body:JSON.stringify({score})}),onSuccess:onSaved});
  return <div className="rounded-2xl border border-border/60 bg-card p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">How useful is this {kind}?</h3><p className="mt-1 text-xs text-muted-foreground">Rate the {kind}, not its individual places.</p></div><p aria-live="polite" className="text-sm">{summary.ratingCount&&summary.ratingAverage!==null?`${summary.ratingAverage.toFixed(1)} / 5 · ${summary.ratingCount} ${summary.ratingCount===1?'rating':'ratings'}`:'Not rated yet'}</p></div>
    <fieldset disabled={!signedIn||summary.publisher||mutation.isPending} className="mt-4"><legend className="sr-only">Your rating</legend><div className="flex flex-wrap items-center gap-1">{[1,2,3,4,5].map(score=><label key={score} className="relative cursor-pointer rounded-lg p-2 has-disabled:cursor-default hover:bg-muted has-focus-visible:ring-2 has-focus-visible:ring-ring"><input className="sr-only" type="radio" name={`plan-rating-${token}`} checked={summary.myRating===score} value={score} aria-label={`${score} ${score===1?'star':'stars'}`} onChange={()=>mutation.mutate(score)}/><Star aria-hidden="true" className={cn('size-6 text-muted-foreground/35',(summary.myRating??0)>=score&&'fill-rating text-rating')}/></label>)}{summary.myRating!==null&&<Button type="button" variant="ghost" size="sm" onClick={()=>mutation.mutate(null)}>Remove rating</Button>}</div></fieldset>
    <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">{mutation.isPending?'Saving your rating…':summary.publisher?`You cannot rate your own ${kind}.`:summary.myRating?`Your rating: ${summary.myRating} / 5. Choose another star to update it.`:signedIn?'Choose a star to save your rating.':`Sign in to rate this ${kind}.`}</p>{mutation.error&&<p role="alert" className="mt-2 text-sm text-destructive">{mutation.error.message}</p>}
  </div>;
}

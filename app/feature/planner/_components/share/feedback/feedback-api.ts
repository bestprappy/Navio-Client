import { z } from 'zod';
import {feedbackPath} from './feedback-path';
const count=z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const feedbackSummarySchema=z.object({ratingAverage:z.number().min(1).max(5).nullable(),ratingCount:count,
  commentCount:count,myRating:z.number().int().min(1).max(5).nullable(),publisher:z.boolean(),canModerate:z.boolean().optional().default(false)});
export const feedbackCommentSchema=z.object({id:z.uuid(),parentId:z.uuid().nullable(),authorName:z.string().nullable(),content:z.string().nullable(),
  deleted:z.boolean(),createdAt:z.string(),updatedAt:z.string(),version:count,canEdit:z.boolean(),canDelete:z.boolean(),replyCount:count});
export const commentPageSchema=z.object({content:z.array(feedbackCommentSchema),hasMore:z.boolean(),total:count,page:count});
export const reportSchema=z.object({commentId:z.uuid(),content:z.string(),reportCount:count});
export type FeedbackSummary=z.infer<typeof feedbackSummarySchema>;
export type FeedbackComment=z.infer<typeof feedbackCommentSchema>;
export class FeedbackError extends Error {
  constructor(message:string,readonly status:number){super(message);this.name='FeedbackError';}
}
export async function feedbackRequest(token:string,path='',init:RequestInit={}):Promise<unknown> {
  const response=await fetch(`${feedbackPath(token)}${path?`/${path}`:''}`,{
    ...init,cache:'no-store',headers:{Accept:'application/json',...(init.body?{'Content-Type':'application/json'}:{}),...init.headers},
  });
  if(!response.ok){
    const body:unknown=await response.json().catch(()=>null);
    const message=body&&typeof body==='object'&&'message' in body&&typeof body.message==='string'?body.message:
      response.status===401?'Please sign in again to contribute.':'Feedback could not be loaded. Please try again.';
    throw new FeedbackError(message,response.status);
  }
  return response.status===204||response.status===201?null:response.json();
}

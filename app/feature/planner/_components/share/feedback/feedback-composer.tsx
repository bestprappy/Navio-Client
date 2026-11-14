'use client';
import { useId, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CommentComposer } from '@/components/comment-tree/comment-composer';
import { feedbackRequest } from './feedback-api';

export const FEEDBACK_COMMENT_MAX_LENGTH=1500;

type FeedbackComposerProps={token:string;name?:string|null;parentId?:string;replyTo?:string|null;
  editing?:{id:string;content:string;version:number};onSaved:()=>Promise<void>;onCancel?:()=>void;autoFocus?:boolean;
  /** Starting text, such as the @name of the reply being answered. */
  initialValue?:string};

/** Posts, replies to and edits Shared Plan and Guide comments in the shared comment box. */
export function FeedbackComposer({token,name,parentId,replyTo,editing,onSaved,onCancel,autoFocus=false,initialValue=''}:FeedbackComposerProps){
  const id=useId();
  const [value,setValue]=useState(editing?.content??initialValue);
  const mutation=useMutation({mutationFn:()=>feedbackRequest(token,editing?`comments/${editing.id}`:'comments',{
    method:editing?'PUT':'POST',body:JSON.stringify(editing?{content:value.trim(),version:editing.version}:{content:value.trim(),authorName:name?.slice(0,100),parentId}),
  }),onSuccess:async()=>{setValue('');onCancel?.();await onSaved();}});
  const placeholder=editing?'Edit your comment':parentId?`Reply to ${replyTo||'this traveler'}`:
    token.startsWith('guide:')?'Ask about this guide, or share what you found useful…':'Ask about the itinerary, or share what you found useful…';
  return <CommentComposer id={`feedback-composer-${id}`} value={value} onChange={setValue} placeholder={placeholder}
    submitLabel={editing?'Save':'Comment'} pendingLabel={editing?'Saving…':'Posting…'} autoFocus={autoFocus}
    pending={mutation.isPending} maxLength={FEEDBACK_COMMENT_MAX_LENGTH} showCount
    error={mutation.error?<p role="alert" className="text-sm text-destructive">{mutation.error.message}</p>:null}
    onCancel={onCancel??(value?()=>{setValue('');mutation.reset();}:undefined)}
    onFocus={initialValue?event=>{const end=event.currentTarget.value.length;event.currentTarget.setSelectionRange(end,end);}:undefined}
    onSubmit={()=>{if(editing&&value.trim()===editing.content.trim()){onCancel?.();return;}if(!editing&&initialValue&&value.trim()===initialValue.trim())return;mutation.mutate();}}/>;
}

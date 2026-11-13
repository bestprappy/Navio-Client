'use client';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { feedbackRequest } from './feedback-api';
export function FeedbackComposer({token,name,parentId,editing,onSaved,onCancel}:{token:string;name?:string|null;parentId?:string;
  editing?:{id:string;content:string;version:number};onSaved:()=>Promise<void>;onCancel?:()=>void}){
  const [value,setValue]=useState(editing?.content??'');
  const mutation=useMutation({mutationFn:()=>feedbackRequest(token,editing?`comments/${editing.id}`:'comments',{
    method:editing?'PUT':'POST',body:JSON.stringify(editing?{content:value,version:editing.version}:{content:value,authorName:name?.slice(0,100),parentId}),
  }),onSuccess:async()=>{setValue('');onCancel?.();await onSaved();}});
  return <form className="space-y-3" onSubmit={e=>{e.preventDefault();if(value.trim()&&!mutation.isPending)mutation.mutate();}}>
    <label className="block"><span className="sr-only">{editing?'Edit comment':parentId?'Your reply':'Your comment'}</span><Textarea value={value} maxLength={1500} disabled={mutation.isPending} onChange={e=>setValue(e.target.value)} placeholder={parentId?'Write a reply…':token.startsWith('guide:')?'Ask about this guide, or share what you found useful…':'Ask about the itinerary, or share what you found useful…'} className="min-h-24 rounded-xl bg-background" onKeyDown={e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();e.currentTarget.form?.requestSubmit();}}}/></label>
    {mutation.error&&<p role="alert" className="text-sm text-destructive">{mutation.error.message}</p>}
    <div className="flex items-center justify-between gap-3"><span className="text-xs text-muted-foreground">{value.length}/1500</span><div className="flex gap-2">{onCancel&&<Button type="button" variant="ghost" size="sm" disabled={mutation.isPending} onClick={onCancel}>Cancel</Button>}<Button type="submit" size="sm" disabled={!value.trim()||mutation.isPending}>{mutation.isPending?'Saving…':editing?'Save changes':parentId?'Post reply':'Post comment'}</Button></div></div>
  </form>;
}

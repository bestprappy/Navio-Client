'use client';
import { useState } from 'react';
import { useInfiniteQuery,useMutation,useQuery } from '@tanstack/react-query';
import { MessageCircle,Flag } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle } from '@/components/ui/dialog';
import { FeedbackComposer } from './feedback-composer';
import { commentPageSchema,feedbackRequest,reportSchema,type FeedbackComment } from './feedback-api';

type ThreadProps={token:string;identity:string;signedIn:boolean;name?:string|null;refresh:()=>Promise<void>;parentId?:string};
export function FeedbackComments(props:ThreadProps){
  const query=useInfiniteQuery({queryKey:['plan-feedback',props.token,props.identity,'comments',props.parentId??'root'],initialPageParam:0,
    queryFn:async({pageParam,signal})=>commentPageSchema.parse(await feedbackRequest(props.token,`comments?${new URLSearchParams({page:String(pageParam),...(props.parentId?{parentId:props.parentId}:{})})}`,{signal})),
    getNextPageParam:last=>last.hasMore?last.page+1:undefined,staleTime:15_000,retry:1});
  const rows=query.data?.pages.flatMap(page=>page.content)??[];
  return <div className="space-y-4">
    {query.isPending?<p role="status" className="text-sm text-muted-foreground">Loading {props.parentId?'replies':'comments'}…</p>:
      query.isError?<div role="alert" className="space-y-2 text-sm"><p>{query.error.message}</p><Button size="sm" variant="outline" onClick={()=>void query.refetch()}>Try again</Button></div>:
      !rows.length?<p className="text-sm text-muted-foreground">{props.parentId?'No replies yet.':'No comments yet. Be the first to start the conversation.'}</p>:null}
    {rows.map(comment=><CommentRow key={comment.id} {...props} comment={comment}/>)}
    {query.hasNextPage&&<Button variant="outline" size="sm" disabled={query.isFetchingNextPage} onClick={()=>void query.fetchNextPage()}>{query.isFetchingNextPage?'Loading…':props.parentId?'More replies':'More comments'}</Button>}
  </div>;
}
function CommentRow({comment,...props}:ThreadProps&{comment:FeedbackComment}){
  const [mode,setMode]=useState<'edit'|'reply'|'delete'|'report'|null>(null);
  const [replies,setReplies]=useState(false);
  const [reason,setReason]=useState('SPAM');
  const [reported,setReported]=useState(false);
  const mutation=useMutation({mutationFn:(action:'delete'|'report')=>feedbackRequest(props.token,`comments/${comment.id}${action==='report'?'/reports':''}`,{
    method:action==='delete'?'DELETE':'POST',...(action==='report'?{body:JSON.stringify({reason})}:{})}),onSuccess:async(_,action)=>{if(action==='report')setReported(true);setMode(null);await props.refresh();}});
  const edited=comment.version>0&&!comment.deleted;
  return <article className="min-w-0 space-y-3 border-t border-border/60 pt-4">
    <header className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs"><strong>{comment.deleted?'Comment removed':comment.authorName||'Navio traveler'}</strong><time dateTime={comment.createdAt} className="text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'})}</time>{edited&&<span className="text-muted-foreground">Edited</span>}</header>
    {mode==='edit'?<FeedbackComposer key={`edit-${comment.id}`} token={props.token} editing={{id:comment.id,content:comment.content??'',version:comment.version}} onSaved={props.refresh} onCancel={()=>setMode(null)}/>:
      <p className="whitespace-pre-wrap wrap-anywhere text-sm leading-7">{comment.deleted?'This comment has been removed. Existing replies remain below.':comment.content}</p>}
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {props.signedIn&&!comment.deleted&&!props.parentId&&<Button size="sm" variant="ghost" onClick={()=>setMode(mode==='reply'?null:'reply')}>Reply</Button>}
      {comment.canEdit&&<Button size="sm" variant="ghost" onClick={()=>setMode(mode==='edit'?null:'edit')}>Edit</Button>}
      {comment.canDelete&&<Button size="sm" variant="ghost" onClick={()=>setMode('delete')}>Delete</Button>}
      {props.signedIn&&!comment.canEdit&&!comment.deleted&&<Button size="sm" variant="ghost" disabled={reported} onClick={()=>setMode('report')}><Flag className="size-3"/>{reported?'Reported':'Report'}</Button>}
      {!props.parentId&&comment.replyCount>0&&<Button size="sm" variant="ghost" aria-expanded={replies} onClick={()=>setReplies(value=>!value)}><MessageCircle className="size-3"/>{replies?'Hide replies':`${comment.replyCount} ${comment.replyCount===1?'reply':'replies'}`}</Button>}
    </div>
    {mode==='reply'&&<FeedbackComposer key={`reply-${comment.id}`} token={props.token} parentId={comment.id} name={props.name} onSaved={async()=>{setReplies(true);await props.refresh();}} onCancel={()=>setMode(null)}/>}
    {replies&&!props.parentId&&<div className="ml-3 border-l border-border pl-4"><FeedbackComments {...props} parentId={comment.id}/></div>}
    <Dialog open={mode==='delete'||mode==='report'} onOpenChange={open=>{if(!open&&!mutation.isPending)setMode(null);}}>
      <DialogContent className="max-w-md"><DialogHeader><DialogTitle>{mode==='delete'?'Remove this comment?':'Report this comment'}</DialogTitle><DialogDescription>{mode==='delete'?'The comment text will be removed. Replies will remain. This cannot be undone.':'The publisher can review reported comments. Reporting does not automatically remove a comment.'}</DialogDescription></DialogHeader>
        {mode==='report'&&<label className="space-y-2 text-sm"><span>Reason</span><select className="block min-h-11 w-full rounded-xl border border-border bg-background px-3" value={reason} onChange={e=>setReason(e.target.value)}><option value="SPAM">Spam</option><option value="HARASSMENT">Harassment</option><option value="INAPPROPRIATE">Inappropriate content</option><option value="OTHER">Other concern</option></select></label>}
        {mutation.error&&<p role="alert" className="text-sm text-destructive">{mutation.error.message}</p>}
        <div className="flex justify-end gap-2"><Button variant="outline" disabled={mutation.isPending} onClick={()=>setMode(null)}>Cancel</Button><Button variant={mode==='delete'?'destructive':'default'} disabled={mutation.isPending} onClick={()=>mutation.mutate(mode==='delete'?'delete':'report')}>{mutation.isPending?'Saving…':mode==='delete'?'Delete comment':'Send report'}</Button></div>
      </DialogContent>
    </Dialog>
  </article>;
}

export function FeedbackReports({token,identity,refresh}:{token:string;identity:string;refresh:()=>Promise<void>}){
  const [open,setOpen]=useState(false);
  const [confirm,setConfirm]=useState<string|null>(null);
  const query=useQuery({queryKey:['plan-feedback',token,identity,'reports'],enabled:open,queryFn:async({signal})=>z.array(reportSchema).parse(await feedbackRequest(token,'reports',{signal})),retry:1});
  const mutation=useMutation({mutationFn:(id:string)=>feedbackRequest(token,`comments/${id}`,{method:'DELETE'}),onSuccess:async()=>{setConfirm(null);await refresh();}});
  return <div className="rounded-xl border border-border p-4"><Button variant="ghost" size="sm" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>{open?'Hide reported comments':'Review reported comments'}</Button>
    {open&&<div className="mt-3 space-y-3">{query.isPending?<p role="status" className="text-sm">Loading reports…</p>:query.error?<p role="alert" className="text-sm">{query.error.message}</p>:!query.data?.length?<p className="text-sm text-muted-foreground">No unresolved reported comments.</p>:query.data.map(report=><div className="space-y-2 border-t border-border pt-3" key={report.commentId}><p className="whitespace-pre-wrap wrap-anywhere text-sm">{report.content}</p><p className="text-xs text-muted-foreground">{report.reportCount} {report.reportCount===1?'report':'reports'}</p>{confirm===report.commentId?<div className="flex gap-2"><Button variant="destructive" size="sm" disabled={mutation.isPending} onClick={()=>mutation.mutate(report.commentId)}>Confirm removal</Button><Button size="sm" variant="ghost" onClick={()=>setConfirm(null)}>Cancel</Button></div>:<Button size="sm" variant="outline" onClick={()=>setConfirm(report.commentId)}>Remove comment</Button>}</div>)}{mutation.error&&<p role="alert">{mutation.error.message}</p>}</div>}
  </div>;
}

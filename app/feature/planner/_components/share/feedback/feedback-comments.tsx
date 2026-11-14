'use client';
import { useEffect,useMemo,useState } from 'react';
import { useInfiniteQuery,useMutation,useQuery } from '@tanstack/react-query';
import { Flag,MessageCircle,Pencil,Plus,Reply,Trash2 } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog,DialogContent,DialogDescription,DialogFooter,DialogHeader,DialogTitle } from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { CommentSortToggle,CommentTreeAction,CommentTreeAvatar,CommentTreeBody,CommentTreeBranch,CommentTreeItem,CommentTreeMenu,CommentTreeMeta } from '@/components/comment-tree/comment-tree';
import { formatRelativeTime } from '@/app/feature/community/_components/data';
import { FeedbackComposer } from './feedback-composer';
import { FEEDBACK_AUTO_LOADED_PAGES,FEEDBACK_COMMENT_ORDERS,orderFeedbackComments,replyMention,type FeedbackCommentOrder } from './feedback-order';
import { commentPageSchema,feedbackRequest,reportSchema,type FeedbackComment } from './feedback-api';

type ThreadProps={token:string;identity:string;signedIn:boolean;name?:string|null;refresh:()=>Promise<void>};

function useCommentPages(props:ThreadProps,parentId?:string){
  return useInfiniteQuery({queryKey:['plan-feedback',props.token,props.identity,'comments',parentId??'root'],initialPageParam:0,
    queryFn:async({pageParam,signal})=>commentPageSchema.parse(await feedbackRequest(props.token,`comments?${new URLSearchParams({page:String(pageParam),...(parentId?{parentId}:{})})}`,{signal})),
    getNextPageParam:last=>last.hasMore?last.page+1:undefined,staleTime:15_000,retry:1});
}

export function authorInitials(name:string|null):string{
  const parts=(name??'').trim().split(/\s+/).filter(Boolean);
  if(!parts.length)return 'N';
  return (parts[0][0]+(parts.length>1?parts[parts.length-1][0]:'')).toUpperCase();
}

function replyCountLabel(count:number){return `${count} ${count===1?'reply':'replies'}`;}

/** Root comments of a Shared Plan or Guide, drawn as the same tree as Community threads. */
export function FeedbackComments(props:ThreadProps){
  const query=useCommentPages(props);
  const [order,setOrder]=useState<FeedbackCommentOrder>('oldest');
  const pageCount=query.data?.pages.length??0;
  const {hasNextPage,isFetchingNextPage,isError,fetchNextPage}=query;
  // The service pages newest first, so load the whole discussion before ordering it.
  useEffect(()=>{if(hasNextPage&&!isFetchingNextPage&&!isError&&pageCount<FEEDBACK_AUTO_LOADED_PAGES)void fetchNextPage();},[hasNextPage,isFetchingNextPage,isError,pageCount,fetchNextPage]);
  const rows=useMemo(()=>orderFeedbackComments(query.data?.pages.flatMap(page=>page.content)??[],order),[query.data,order]);
  const loadingAll=hasNextPage&&pageCount<FEEDBACK_AUTO_LOADED_PAGES&&!isError;
  if(query.isPending||(loadingAll&&!rows.length))return <div role="status" className="space-y-4"><span className="sr-only">Loading comments</span><Skeleton className="h-20 w-full rounded-2xl"/><Skeleton className="h-20 w-full rounded-2xl"/></div>;
  if(query.isError&&!rows.length)return <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm"><span>Comments could not be loaded. {query.error.message}</span><Button size="sm" variant="outline" className="rounded-full" onClick={()=>void query.refetch()}>Try again</Button></div>;
  if(!rows.length)return <div className="rounded-xl border border-dashed border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">No comments yet. Be the first to start the conversation.</div>;
  return <div className="flex flex-col gap-5">
    {rows.length>1&&<CommentSortToggle options={FEEDBACK_COMMENT_ORDERS} value={order} onChange={setOrder}/>}
    <CommentTreeBranch level={0}>{rows.map((comment,index)=><FeedbackCommentNode key={comment.id} {...props} comment={comment} level={0} isLastSibling={index===rows.length-1}/>)}</CommentTreeBranch>
    {loadingAll&&<p role="status" className="text-xs text-muted-foreground">Loading earlier comments…</p>}
    {query.isError&&<div role="alert" className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span>Some comments could not be loaded.</span><CommentTreeAction onClick={()=>void fetchNextPage()}>Try again</CommentTreeAction></div>}
    {hasNextPage&&!loadingAll&&!query.isError&&<Button type="button" variant="outline" className="self-start rounded-full" disabled={isFetchingNextPage} onClick={()=>void fetchNextPage()}><MessageCircle className="size-4" aria-hidden="true"/>{isFetchingNextPage?'Loading…':'Load more comments'}</Button>}
  </div>;
}

/** Replies are fetched per root comment, so they load only while the branch is open. */
function FeedbackReplies({parent,...props}:ThreadProps&{parent:FeedbackComment}){
  const query=useCommentPages(props,parent.id);
  const rows=query.data?.pages.flatMap(page=>page.content)??[];
  const remaining=Math.max(0,parent.replyCount-rows.length);
  if(query.isPending)return <p role="status" className="px-2 text-xs text-muted-foreground">Loading replies…</p>;
  if(query.isError)return <div role="alert" className="flex flex-wrap items-center gap-2 px-2 text-xs text-muted-foreground"><span>Replies could not be loaded.</span><CommentTreeAction onClick={()=>void query.refetch()}>Try again</CommentTreeAction></div>;
  if(!rows.length)return <p className="px-2 text-xs text-muted-foreground">No replies yet.</p>;
  return <div>
    <CommentTreeBranch level={1}>{rows.map((comment,index)=><FeedbackCommentNode key={comment.id} {...props} comment={comment} rootId={parent.id} level={1} isLastSibling={index===rows.length-1}/>)}</CommentTreeBranch>
    {query.hasNextPage&&<div className="mt-3"><CommentTreeAction icon={<Plus className="size-3.5" aria-hidden="true"/>} disabled={query.isFetchingNextPage} onClick={()=>void query.fetchNextPage()}>{query.isFetchingNextPage?'Loading…':remaining?`View ${remaining} more ${remaining===1?'reply':'replies'}`:'View more replies'}</CommentTreeAction></div>}
  </div>;
}

function FeedbackCommentNode({comment,rootId,level,isLastSibling,...props}:ThreadProps&{comment:FeedbackComment;rootId?:string;level:number;isLastSibling:boolean}){
  const [mode,setMode]=useState<'edit'|'reply'|'delete'|'report'|null>(null);
  const [collapsed,setCollapsed]=useState(false);
  const [reason,setReason]=useState('SPAM');
  const [reported,setReported]=useState(false);
  const mutation=useMutation({mutationFn:(action:'delete'|'report')=>feedbackRequest(props.token,`comments/${comment.id}${action==='report'?'/reports':''}`,{
    method:action==='delete'?'DELETE':'POST',...(action==='report'?{body:JSON.stringify({reason})}:{})}),onSuccess:async(_,action)=>{if(action==='report')setReported(true);setMode(null);await props.refresh();}});
  const repliesId=`feedback-replies-${comment.id}`;
  // Plan and Guide discussions are two levels deep: answering a reply joins its
  // root thread and starts with the @name of the reply being answered.
  const hasReplies=level===0&&comment.replyCount>0;
  const editing=mode==='edit'&&!comment.deleted;
  const canReply=props.signedIn&&!comment.deleted;
  const canReport=props.signedIn&&!comment.canEdit&&!comment.deleted;
  const hasMenu=comment.canEdit||comment.canDelete||canReport;
  return <CommentTreeItem id={`feedback-comment-${comment.id}`} level={level} isLastSibling={isLastSibling}
    avatar={<CommentTreeAvatar initials={comment.deleted?'–':authorInitials(comment.authorName)}/>}
    collapse={hasReplies?{collapsed,onToggle:()=>setCollapsed(value=>!value),controlsId:repliesId}:undefined}
    railVisible={hasReplies&&!collapsed}
    replies={!hasReplies?null:collapsed?<CommentTreeAction expanded={false} controls={repliesId} onClick={()=>setCollapsed(false)}>{replyCountLabel(comment.replyCount)}</CommentTreeAction>:<FeedbackReplies {...props} parent={comment}/>}>
    <CommentTreeMeta author={comment.authorName||'Navio traveler'} createdAt={comment.createdAt} timeLabel={formatRelativeTime(comment.createdAt)} edited={comment.version>0&&!comment.deleted} deleted={comment.deleted}/>
    {editing?<div className="mt-2"><FeedbackComposer key={`edit-${comment.id}`} token={props.token} autoFocus editing={{id:comment.id,content:comment.content??'',version:comment.version}} onSaved={props.refresh} onCancel={()=>setMode(null)}/></div>:
      <CommentTreeBody deleted={comment.deleted}>{comment.content}</CommentTreeBody>}
    {!comment.deleted&&!editing&&(canReply||hasMenu)&&<div className="mt-2 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
      {canReply&&<CommentTreeAction pill icon={<Reply className="size-3.5" aria-hidden="true"/>} expanded={mode==='reply'} onClick={()=>setMode(mode==='reply'?null:'reply')}>Reply</CommentTreeAction>}
      {hasMenu&&<CommentTreeMenu>
        {comment.canEdit&&<DropdownMenuItem onClick={()=>setMode('edit')}><Pencil aria-hidden="true"/>Edit</DropdownMenuItem>}
        {canReport&&<DropdownMenuItem disabled={reported} onClick={()=>setMode('report')}><Flag aria-hidden="true"/>{reported?'Reported':'Report'}</DropdownMenuItem>}
        {comment.canDelete&&<DropdownMenuItem variant="destructive" onClick={()=>setMode('delete')}><Trash2 aria-hidden="true"/>Delete</DropdownMenuItem>}
      </CommentTreeMenu>}
    </div>}
    {mode==='reply'&&canReply&&<div className="mt-3"><FeedbackComposer key={`reply-${comment.id}`} token={props.token} autoFocus parentId={rootId??comment.id} replyTo={comment.authorName} initialValue={rootId?replyMention(comment.authorName):''} name={props.name} onSaved={async()=>{setCollapsed(false);setMode(null);await props.refresh();}} onCancel={()=>setMode(null)}/></div>}
    <Dialog open={mode==='delete'||mode==='report'} onOpenChange={open=>{if(!open&&!mutation.isPending){setMode(null);mutation.reset();}}}>
      <DialogContent className="max-w-md"><DialogHeader><DialogTitle>{mode==='delete'?'Delete comment?':'Report this comment'}</DialogTitle><DialogDescription>{mode==='delete'?'The comment text will be removed. Replies will remain. This cannot be undone.':'Navio moderators and the publisher review reported comments. Reporting does not automatically remove a comment.'}</DialogDescription></DialogHeader>
        {mode==='report'&&<label className="space-y-2 text-sm"><span>Reason</span><select className="block min-h-11 w-full rounded-xl border border-border bg-background px-3" value={reason} onChange={e=>setReason(e.target.value)}><option value="SPAM">Spam</option><option value="HARASSMENT">Harassment</option><option value="INAPPROPRIATE">Inappropriate content</option><option value="OTHER">Other concern</option></select></label>}
        {mutation.error&&<p role="alert" className="text-sm text-destructive">{mutation.error.message}</p>}
        <DialogFooter><Button type="button" variant="outline" disabled={mutation.isPending} onClick={()=>setMode(null)}>Cancel</Button><Button type="button" variant={mode==='delete'?'destructive':'default'} disabled={mutation.isPending} onClick={()=>mutation.mutate(mode==='delete'?'delete':'report')}>{mutation.isPending?(mode==='delete'?'Deleting…':'Sending…'):mode==='delete'?'Delete comment':'Send report'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </CommentTreeItem>;
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

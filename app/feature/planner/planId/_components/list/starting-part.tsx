"use client";
import {useState} from "react";
import {atom,useAtomValue,useSetAtom} from "jotai";
import {FileText,Plus,Trash2,Undo2} from "lucide-react";
import {Button} from "@/components/ui/button";
import {PlaceNotesPreview} from "../block/items/place-notes";
import {NoteEditor} from "@/components/block-editor/note-editor";
import {tripBlocksAtom,plannerReadOnlyAtom} from "../overview/trip-builder.atoms";
import type {TripBlockData} from "../constants/types";
const startingPartAtom=atom(get=>get(tripBlocksAtom).find(block=>block.id.startsWith("starting-part-")));
export function AddStartingPart(){
 const current=useAtomValue(startingPartAtom),readOnly=useAtomValue(plannerReadOnlyAtom),setBlocks=useSetAtom(tripBlocksAtom);
 if(current||readOnly)return null;
 return <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={()=>setBlocks(blocks=>blocks.some(b=>b.id.startsWith("starting-part-"))?blocks:[{id:"starting-part-main",kind:"list",title:"Before you go",date:new Date().toISOString().slice(0,10),colorId:"teal",items:[{id:"starting-part-note",type:"note",content:""}]},...blocks])}><Plus className="size-3.5" />Add Starting Part</Button>;
}
export function StartingPart(){
 const block=useAtomValue(startingPartAtom),readOnly=useAtomValue(plannerReadOnlyAtom),setBlocks=useSetAtom(tripBlocksAtom);
 const [removed,setRemoved]=useState<TripBlockData|null>(null);
 if(!block)return removed?<div role="status" className="my-4 flex items-center justify-between rounded-xl border border-border p-3 text-sm">Starting Part removed<Button variant="ghost" size="sm" onClick={()=>{setBlocks(blocks=>[removed,...blocks]);setRemoved(null);}}><Undo2 className="size-3.5" />Undo</Button></div>:null;
 const note=block.items.find(i=>i.type==="note");
 function update(title:string,content?:string){if(readOnly)return;setBlocks(blocks=>blocks.map(b=>b.id!==block!.id?b:{...b,title,items:content===undefined?b.items:b.items.map(i=>i.type==="note"?{...i,content}:i)}));}
 return <section aria-label="Starting Part" className="my-5 overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
 <div className="flex items-start gap-3 border-b border-border/60 px-5 py-4"><FileText className="mt-1 size-5 shrink-0 text-primary" /><div className="min-w-0 flex-1"><label className="text-xs font-medium text-muted-foreground" htmlFor="starting-part-title">Starting Part</label><input id="starting-part-title" aria-label="Starting Part title" value={block.title} readOnly={readOnly} maxLength={255} onChange={e=>update(e.target.value)} className="mt-1 block w-full rounded-sm bg-transparent text-lg font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring" /><p className="mt-1 text-xs leading-5 text-muted-foreground">Introduce your trip and share useful tips before the itinerary.</p></div>{!readOnly&&<Button variant="ghost" size="icon-sm" aria-label="Remove Starting Part" onClick={()=>{setRemoved(block);setBlocks(blocks=>blocks.filter(b=>b.id!==block.id));}}><Trash2 className="size-4" /></Button>}</div>
 <div className="min-h-40 px-5 py-4">{note?.type==="note"&&(readOnly?<PlaceNotesPreview value={note.content} interactive={true} clamped={false} />:<NoteEditor value={note.content} onChange={value=>update(block.title,value)} label="Starting Part document" placeholder="Tell readers about your trip. Add headings, helpful tips, links or a list..." />)}</div>
 </section>;
}

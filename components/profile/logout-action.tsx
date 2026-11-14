"use client";
import {useMutation} from "@tanstack/react-query";
import {signOut} from "next-auth/react";
import {LogOut} from "lucide-react";
import {DropdownMenuItem} from "@/components/ui/dropdown-menu";
import {cn} from "@/lib/utils";
export function LogoutAction({className,onNavigate,menu=false}:{className?:string;onNavigate?:()=>void;menu?:boolean}){
 const logout=useMutation({mutationFn:()=>signOut({redirectTo:"/"})});
 const content=<><LogOut aria-hidden="true" className="size-4 shrink-0"/>{logout.isPending?"Logging out...":"Log out"}</>;
 if(menu)return <><DropdownMenuItem variant="destructive" disabled={logout.isPending} closeOnClick={false} onClick={()=>{onNavigate?.();logout.mutate();}}>{content}</DropdownMenuItem>{logout.isError&&<p role="alert" className="px-3 text-xs text-destructive">Could not log out. Please try again.</p>}</>;
 return <div><button type="button" disabled={logout.isPending} onClick={()=>{onNavigate?.();logout.mutate();}} className={cn("flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-destructive hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",className)}>{content}</button>{logout.isError&&<p role="alert" className="px-3 text-xs text-destructive">Could not log out. Please try again.</p>}</div>;
}

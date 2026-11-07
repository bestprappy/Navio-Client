"use client";
import type {ReactNode} from "react";
import Link from "next/link";
import {Settings,UserRound} from "lucide-react";
import {DropdownMenu,DropdownMenuTrigger,DropdownMenuContent,DropdownMenuItem} from "@/components/ui/dropdown-menu";
export function AccountMenu({username,children,className,onNavigate}:{username?:string|null;children:ReactNode;className?:string;onNavigate?:()=>void}){
 return <DropdownMenu><DropdownMenuTrigger className={className} aria-label="Open account menu">{children}</DropdownMenuTrigger>
  <DropdownMenuContent className="min-w-52" align="end">
   <DropdownMenuItem render={<Link href={username?`/u/${encodeURIComponent(username)}`:"/settings/profile"} onClick={onNavigate}/> }><UserRound/>Profile</DropdownMenuItem>
   <DropdownMenuItem render={<Link href="/settings/profile" onClick={onNavigate}/> }><Settings/>Account Settings</DropdownMenuItem>
  </DropdownMenuContent></DropdownMenu>;
}

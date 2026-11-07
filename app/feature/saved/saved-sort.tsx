"use client";
import {useId} from "react";
import {Select,SelectTrigger,SelectContent,SelectItem,SelectValue} from "@/components/ui/select";
export function SavedSort({value,options,onChange}:{value:string;options:readonly {value:string;label:string}[];onChange:(value:string)=>void}){
 const id=useId();return <div className="flex min-w-44 flex-col gap-2"><label htmlFor={id} className="text-xs font-medium">Sort by</label>
 <Select value={value} items={options} onValueChange={value=>{if(value)onChange(value);}}><SelectTrigger id={id} className="h-10 w-full rounded-xl"><SelectValue/></SelectTrigger>
 <SelectContent alignItemWithTrigger={false}>{options.map(option=><SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>;
}

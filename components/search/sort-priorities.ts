export type SortOptions=readonly (readonly [string,string])[];
export function sortValues(value:string,options:SortOptions):string[]{
 const allowed=new Set(options.map(([key])=>key));
 const selected=[...new Set(value.split(',').filter(key=>key!=='relevance'&&allowed.has(key)))];
 return selected.length?selected:['relevance'];
}
export function togglePriority(order:string,key:string,options:SortOptions):string{
 if(key==='relevance')return 'relevance';
 if(!options.some(([value])=>value===key))return order;
 const values=sortValues(order,options).filter(value=>value!=='relevance');
 return (values.includes(key)?values.filter(value=>value!==key):[...values,key]).join(',')||'relevance';
}
export function movePriority(order:string,key:string,direction:-1|1,options:SortOptions):string{
 const values=sortValues(order,options),index=values.indexOf(key),target=index+direction;
 if(index<0||target<0||target>=values.length)return order;
 [values[index],values[target]]=[values[target],values[index]];return values.join(',');
}

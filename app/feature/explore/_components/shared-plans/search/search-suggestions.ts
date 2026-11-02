import type { ExplorePlan } from '../explore-plans-api';
import { durationDays, type PlanSearchState } from './search-state';
import { countries } from '../../../places/search-state';
import type { PlanDestinationSuggestion } from './search-api';
import { countryAliases, geographicAliases, generalIntentAliases, travelThemes, travelTopics } from './data';
export type SearchDestination = Omit<PlanDestinationSuggestion,'count'> & {count?:number};
export const normalizeTravelText=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const escaped=(value:string)=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const mentions=(text:string,name:string)=>new RegExp(`(?:^| )${escaped(normalizeTravelText(name)).replaceAll(' ',' *')}(?: |$)`,'u').test(normalizeTravelText(text));
const themesIn=(text:string)=>Object.entries(travelThemes).filter(([,aliases])=>aliases.some(alias=>mentions(text,alias))).map(([theme])=>theme);
function contexts(knownPlans:ExplorePlan[],remote:PlanDestinationSuggestion[]) {
 const values=[...geographicAliases.map(g=>({name:g.name,country:g.country,kind:'city' as const})),
  ...knownPlans.filter(p=>p.destinationCity).map(p=>({name:p.destinationCity!,country:countries.find(c=>normalizeTravelText(c.name)===normalizeTravelText(p.destinationCountry||''))?.code||'',kind:'city' as const})),
  ...remote.map(d=>({name:d.label,country:d.country,kind:d.kind}))];
 return [...new Map(values.map(g=>[`${normalizeTravelText(g.name)}:${g.country}`,g])).values()];
}
/** General completions stay independent from catalogue result count or availability. */
export function buildPlanSuggestions(text:string,country:string,remote:PlanDestinationSuggestion[],knownPlans:ExplorePlan[]=[]){
 const query=normalizeTravelText(text);if(query.length<2)return {destinations:[] as SearchDestination[],queries:[] as string[]};
 const words=query.split(' '),tail=words.at(-1)||'',prefix=text.trim().slice(0,text.trim().lastIndexOf(' ')+1);
 const matches=(label:string)=>normalizeTravelText(label).startsWith(query)||normalizeTravelText(label).split(' ').some((_,i,parts)=>parts.slice(i).join(' ').startsWith(query));
 const mentionedCountries=countries.filter(c=>mentions(query,c.name)||countryAliases[c.code]?.some(alias=>mentions(query,alias)));
 const locations=contexts(knownPlans,remote).filter(g=>(!country||g.country===country)&&(!mentionedCountries.length||mentionedCountries.some(c=>c.code===g.country)));
 const mentioned=locations.filter(g=>mentions(query,g.name)||geographicAliases.find(a=>a.name===g.name)?.aliases.some(alias=>mentions(query,alias))).sort((a,b)=>b.name.length-a.name.length);
 const local:SearchDestination[]=countries.filter(c=>(!country||country===c.code)&&(matches(c.name)||mentions(query,c.name)||countryAliases[c.code]?.some(a=>normalizeTravelText(a).startsWith(query)||mentions(query,a))))
  .map(c=>({id:`country:${c.code}`,label:c.name,country:c.code,kind:'country'}));
 const relevantRemote=remote.filter(d=>(!country||d.country===country)&&(matches(d.label)||mentions(query,d.label)||locations.some(g=>g.name===d.label&&normalizeTravelText(g.name).startsWith(tail))));
 const destinations=[...new Map([...local,...relevantRemote].map(d=>[d.id,d])).values()].sort((a,b)=>Number(!normalizeTravelText(a.label).startsWith(query))-Number(!normalizeTravelText(b.label).startsWith(query))||(b.count??0)-(a.count??0)||a.label.localeCompare(b.label)).slice(0,4);
 const phrases:string[]=[];
 const corrected=text.trim().replace(/\bhuahin\b/gi,'Hua Hin').replace(/\bscenary\b/gi,'scenic');
 if(corrected!==text.trim())phrases.push(corrected);
 for(const location of locations) {
  const parts=text.trim().split(/\s+/),name=normalizeTravelText(location.name);
  for(let start=0;start<parts.length;start++) {
   const unfinished=normalizeTravelText(parts.slice(start).join(' '));
   if(unfinished.length>=2&&name.startsWith(unfinished)&&name!==unfinished){const before=parts.slice(0,start);if(start>0&&normalizeTravelText(before.at(-1)||'')===name.split(' ')[0])continue;phrases.push([...before,location.name].join(' '));break;}
  }
 }
 const cityCompleted=phrases.some(phrase=>locations.some(location=>mentions(phrase,location.name)&&!mentions(text,location.name)));
 if(!cityCompleted)phrases.push(...travelTopics.filter(topic=>normalizeTravelText(topic).startsWith(tail)).slice(0,3).map(topic=>prefix+topic.toLowerCase()));
 const place=mentioned[0]?.name||mentionedCountries[0]?.name||destinations.find(d=>d.kind==='country')?.label;
 const themes=themesIn(query);
 if(place){
  const subject=[place,...themes.map(t=>t==='road'?'road':t==='walking'?'walking':t==='ev'?'EV':t)].join(' ');
  if(themes.length){phrases.push(`${subject} trip`,`${subject} itinerary`,`${subject} weekend trip`);}
  else phrases.push(`${place} itinerary`,`${place} road trip`,`${place} weekend trip`);
 }else{
  if(themes.length){const subject=themes.join(' and ');phrases.push(`${subject} trip`,`${subject} itinerary`);}
 }
 // An unknown phrase remains searchable, without pretending that it is a known destination or plan.
 if(!phrases.length)phrases.push(text.trim());
 return {destinations,queries:[...new Map(phrases.map(p=>[normalizeTravelText(p),p])).values()].slice(0,4)};
}
export function knownPlanSuggestions(text:string,state:PlanSearchState,plans:ExplorePlan[]){
 const query=normalizeTravelText(text);if(query.length<2)return {matching:[] as ExplorePlan[],related:[] as ExplorePlan[]};
 const context=contexts(plans,[]),geo=context.filter(g=>mentions(query,g.name)),country=countries.find(c=>mentions(query,c.name)||countryAliases[c.code]?.some(alias=>mentions(query,alias)));
 const geoCountries=new Set(geo.map(g=>g.country));
 const anchor=country?.code||state.country||(geoCountries.size===1?geo[0]?.country:undefined),selected=countries.find(c=>c.code===state.country)?.name,days=durationDays(state.duration,state.unit),wanted=themesIn(query);
 let residual=query;
 for(const g of geo)residual=residual.replace(new RegExp(escaped(normalizeTravelText(g.name)).replaceAll(' ',' *'),'gu'),' ');
 if(country)residual=residual.replace(normalizeTravelText(country.name),' ');
 for(const aliases of Object.values(travelThemes))for(const alias of aliases)if(generalIntentAliases.has(alias))residual=residual.replace(new RegExp(`\\b${escaped(alias)}\\b`,'gu'),' ');
 const terms=residual.split(/\s+/).filter(t=>t&&!['trip','trips','plan','plans','itinerary','itineraries','and','the','for','in','focus','travel','with','a','of'].includes(t));
 const matching:ExplorePlan[]=[],related:ExplorePlan[]=[];
 for(const plan of new Map(plans.map(p=>[p.token,p])).values()){
  const planCountry=countries.find(c=>normalizeTravelText(c.name)===normalizeTravelText(plan.destinationCountry||''));
  if(selected&&normalizeTravelText(plan.destinationCountry||'')!==normalizeTravelText(selected)||anchor&&planCountry?.code!==anchor||!anchor&&geoCountries.size>1&&!geoCountries.has(planCountry?.code||'')||state.duration&&(days===null||plan.dayCount!==days))continue;
  const all=normalizeTravelText([plan.title,plan.destinationCity,plan.destinationCountry,...(plan.highlights||[])].filter(Boolean).join(' '));
  const themeHits=wanted.filter(t=>themesIn(all).includes(t)).length,termHits=terms.filter(t=>all.split(' ').some(w=>w.startsWith(t))).length;
  const localMatch=geo.every(g=>mentions(all,g.name));
  if(localMatch&&themeHits===wanted.length&&termHits===terms.length)matching.push(plan);
  else if(anchor||themeHits||termHits)related.push(plan);
 }
 const rank=(a:ExplorePlan,b:ExplorePlan)=>Number(!normalizeTravelText(a.title||'').startsWith(query))-Number(!normalizeTravelText(b.title||'').startsWith(query));
 return {matching:matching.sort(rank).slice(0,4),related:related.sort(rank).slice(0,4)};
}
export function matchKnownPlans(text:string,state:PlanSearchState,plans:ExplorePlan[]){return knownPlanSuggestions(text,state,plans).matching;}

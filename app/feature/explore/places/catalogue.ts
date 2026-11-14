import {cataloguePlaces} from './catalogue.data';
import type {DiscoveryItem} from './places-api';
import type {PlaceSearchResult} from '../../planner/planId/_components/constants/types';
export {cataloguePlaces};
export function canonicalCatalogueId(id:string){try{for(let n=0;n<2&&id.includes('%');n++)id=decodeURIComponent(id);}catch{return id;}return id;}
export const isCatalogueId=(id:string)=>canonicalCatalogueId(id).startsWith('NAVIO:');
export function findCataloguePlace(id:string){return cataloguePlaces.find(p=>p.id===canonicalCatalogueId(id));}
const normal=(s:string)=>s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export function catalogueItem(id:string):DiscoveryItem|null{
 const p=findCataloguePlace(id);if(!p)return null;
 return {place:{providerPlaceId:p.id,name:p.name,address:`${p.city}, Thailand`,country:'Thailand',city:p.city,location:{lat:p.lat,lng:p.lng},category:p.category,description:p.description,photoUrl:p.photo.path,website:p.sourceUrl},photos:[{url:p.photo.path,attributions:[{displayName:`${p.photo.author} - ${p.photo.license}`,uri:p.photo.sourceUrl}],googleMapsUri:p.photo.sourceUrl}],photoAttributions:[{displayName:`${p.photo.author} - ${p.photo.license}`,uri:p.photo.sourceUrl}],photoGoogleMapsUri:p.photo.sourceUrl,reason:null};
}
export type CataloguePlaceDetail=Omit<PlaceSearchResult,"provider"> & {provider:"CATALOGUE"};
export function catalogueDetail(id:string):CataloguePlaceDetail|null{
 const p=findCataloguePlace(id);if(!p)return null;
 return {id:p.id,provider:'CATALOGUE',providerPlaceId:p.id,name:p.name,address:`${p.city}, Thailand`,lat:p.lat,lng:p.lng,category:p.category,description:p.description,imageUrl:p.photo.path,website:p.sourceUrl,primaryType:p.type};
}
export function catalogueSavedLocation(id:string){const p=findCataloguePlace(id);return p?{name:p.name,address:`${p.city}, Thailand`,lat:p.lat,lng:p.lng}:undefined;}
export function searchCatalogue(params:URLSearchParams){
 const country=(params.get('country')??'').toUpperCase();const raw=params.get('query')??'';
 const words=normal(raw).split(' ').filter(w=>w&&!['trip','places','place','in','for','the','and','visit'].includes(w));
 const destination=normal(params.get('destination')??'');
 const types=params.getAll('type');const interests=params.getAll('interest');const collection=params.get('collection')??'';
 const time=params.get('time')??'any';const month=Number(time.split(':')[1]);
 const wet=time==='season:wet'||(time.startsWith('month:')&&month>=5&&month<=10);
 const warm=time==='season:summer'||(time.startsWith('month:')&&month>=3&&month<=4);
 const theme=wet||warm?'indoor':'scenic';
 const scored=cataloguePlaces.filter(p=>(!country||country===p.country)&&(!destination||normal(`${p.city} Thailand`).includes(destination))&&(!types.length||types.includes(p.type))&&(!interests.length||interests.some(t=>(p.sections as readonly string[]).includes(t)))&&(!collection||collection==='seasonal'||(p.sections as readonly string[]).includes(collection)))
 .map(p=>{const title=normal(p.name);const text=normal([p.name,p.city,'Thailand',p.category,p.description,p.type,...p.sections].join(' '));const matches=words.every(w=>text.includes(w)||(['food','restaurant','cafe','cafes','restaurants'].includes(w)&&p.sections.some(s=>s==='food')));return {p,matches,score:words.reduce((n,w)=>n+(title.includes(w)?3:text.includes(w)?1:0),0)+(time!=='any'&&(p.sections as readonly string[]).includes(theme)?2:0)};})
 .filter(r=>r.matches).sort((a,b)=>b.score-a.score||a.p.name.localeCompare(b.p.name));
 // Cursor belongs to precisely one filter selection; never silently reuse another search's offset.
 const keys=[...params.entries()].filter(([k])=>k!=='cursor').sort().map(([k,v])=>`${k}=${v}`).join('&');
 let hash=2166136261;for(const ch of keys)hash=Math.imul(hash^ch.charCodeAt(0),16777619)>>>0;
 const cursor=params.get('cursor')??'';let offset=0;if(cursor){const [fingerprint,index]=cursor.split(':');if(fingerprint!==String(hash)||!/^\d+$/.test(index??''))throw new Error('Invalid catalogue cursor');offset=Number(index);if(!Number.isSafeInteger(offset)||offset>scored.length)throw new Error('Invalid catalogue cursor');}
 const items=scored.slice(offset,offset+8).map(r=>catalogueItem(r.p.id)!);const next=offset+items.length;
 return {items,recommendationIds:[],cursor:next<scored.length?`${hash}:${next}`:null,mode:raw||types.length?'results' as const:'discovery' as const,seasonalNotice:time==='any'?null:'Navio editorial ordering: outdoor inspiration or indoor alternatives for your selection. These are not weather forecasts or verified seasonal opening dates.',seasonalSources:[]};
}
export function suggestCatalogue(query:string,country:string){const q=normal(query).slice(0,200);return {items:q.length<2?[]:cataloguePlaces.filter(p=>(!country||p.country===country.toUpperCase())&&q.split(' ').every(word=>normal([p.name,p.city,'Thailand',p.category,p.type,...p.sections].join(' ')).includes(word))).slice(0,6).map(p=>({kind:'place' as const,label:p.name,value:p.name,placeId:p.id,interest:null})),providerAvailable:false};}

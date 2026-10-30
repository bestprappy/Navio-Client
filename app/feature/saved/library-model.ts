export const savedTabs = ['recents','all','plans','guides','places','trash'] as const;
export function clampSavedPage(page:number,total:number){return Math.min(page,Math.max(0,Math.ceil(total/24)-1));}
export type SavedTab=typeof savedTabs[number];
export type SavedSearch={tab:SavedTab;search:string;sort:'NEWEST'|'OLDEST'|'NAME'|'OPENED';page:number;country:string;city:string;source:string;category:string;savedAfter:string;openedAfter:string};
export function parseSavedSearch(p:URLSearchParams):SavedSearch {
 const tab=p.get('tab')??'recents',sort=p.get('sort')??'NEWEST';
 return {tab:savedTabs.includes(tab as SavedTab)?tab as SavedTab:'recents',search:(p.get('q')??'').slice(0,200),
  sort:['NEWEST','OLDEST','NAME','OPENED'].includes(sort)?sort as SavedSearch['sort']:'NEWEST',page:Math.max(0,Math.min(100000,Number.parseInt(p.get('page')??'0',10)||0)),
  country:(p.get('country')??'').slice(0,120),city:(p.get('city')??'').slice(0,120),source:['DIRECT','SHARED_PLAN'].includes(p.get('source')??'')?p.get('source')!:'',category:(p.get('category')??'').slice(0,120),
  savedAfter:validDate(p.get('savedAfter')),openedAfter:validDate(p.get('openedAfter'))};
}
function validDate(v:string|null){return v&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))?v:'';}
export function savedSearchParams(s:SavedSearch){const p=new URLSearchParams();p.set('tab',s.tab);if(s.search)p.set('q',s.search);if(s.sort!=='NEWEST')p.set('sort',s.sort);if(s.page)p.set('page',String(s.page));for(const k of ['country','city','source','category','savedAfter','openedAfter'] as const)if(s[k])p.set(k,s[k]);return p;}
export function placeIdentity(provider:string|null|undefined,lat:number,lng:number){if(provider?.trim()){const id=provider.trim();return /^GOOGLE:/i.test(id)?`google:${id.slice(7)}`:id.startsWith('ChIJ')?`google:${id}`:id;}return `coordinates:${lat.toFixed(6)},${lng.toFixed(6)}`;}
export type BookmarkLocation={providerPlaceId?:string|null;name:string;address?:string|null;location:{lat:number;lng:number};category?:string|null;country?:string|null;city?:string|null};
export function locationBookmark(p:BookmarkLocation,sourceToken?:string){return {providerPlaceId:p.providerPlaceId??null,name:p.name,address:p.address??null,lat:p.location.lat,lng:p.location.lng,category:p.category??null,country:p.country??null,city:p.city??null,sourceToken:sourceToken??null};}

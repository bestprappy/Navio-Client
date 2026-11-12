import {countries,seasons} from '../../explore/places/search-state';
import {requestText} from '../../explore/_components/shared-plans/search/search-draft';
export const guideCollections=[['trending','Trending'],['popular','Most popular'],['seasonal','Seasonal'],['scenic','Scenic escapes'],['food','Food & cafés'],['sweets','Sweet spots'],['relax','Slow escapes'],['night','After dark'],['nature','Nature lovers']] as const;
export const guideInterests=[['architecture','Architecture'],['museums','Museums'],['street-food','Street food'],['hiking','Hiking'],['beaches','Beaches'],['shopping','Shopping']] as const;
export const guideSorts=[['relevance','Recommended'],['trending','Trending'],['popular','Most popular'],['views','Most viewed'],['recent','Recently published'],['updated','Recently updated']] as const;
export type GuideSearchState={query:string;country:string;time:string;sort:string;collections:string[];interests:string[]};
export const emptyGuideSearch:GuideSearchState={query:'',country:'',time:'any',sort:'relevance',collections:[],interests:[]};
const selected=(raw:string|null,options:readonly (readonly [string,string])[])=>[...new Set((raw??'').split(',').filter(value=>options.some(([key])=>key===value)))];
export function parseGuideSearch(params:URLSearchParams):GuideSearchState {
 const country=(params.get('guideCountry')??'').toUpperCase(),time=params.get('guideTime')??'any';
 const sorts=selected(params.get('guideSort'),guideSorts).filter(value=>value!=='relevance');
 return {query:requestText(params.get('guideQuery')??(params.get('tab')==='guides'?params.get('term')??'':'')),country:countries.some(c=>c.code===country)?country:'',time:/^month:([1-9]|1[0-2])$/.test(time)||seasons.some(s=>time===`season:${s.id}`)?time:'any',sort:sorts.join(',')||'relevance',collections:selected(params.get('guideCollections'),guideCollections),interests:selected(params.get('guideInterests'),guideInterests)};
}
export function guideSearchParams(state:GuideSearchState,base=new URLSearchParams()) {
 const params=new URLSearchParams(base);params.set('tab','guides');
 for(const [key,value] of Object.entries({guideQuery:requestText(state.query),guideCountry:state.country,guideTime:state.time==='any'?'':state.time,guideSort:state.sort==='relevance'?'':state.sort,guideCollections:state.collections.join(','),guideInterests:state.interests.join(',')})) {if(value)params.set(key,value);else params.delete(key);}
 return params;
}
export function guideRequestParams(state:GuideSearchState,page=0,size=12) {
 const params=new URLSearchParams({page:String(page),size:String(size),time:state.time,sort:state.sort});
 for(const [key,value] of Object.entries({term:requestText(state.query),country:state.country,collections:state.collections.join(','),interests:state.interests.join(',')}))if(value)params.set(key,value);
 return params;
}
export const guideResultMode=(state:GuideSearchState)=>!!state.query.trim()||state.interests.length>0;
export const nextGuidePage=(page:{number:number;last:boolean})=>page.last?undefined:page.number+1;
export const guideIdentity=(entry:{source:string;id:string})=>`${entry.source}:${entry.id}`;
export const guideHref=(entry:{source:string;id:string})=>`/explore/guides/${encodeURIComponent(entry.id)}${entry.source==='CURATED'?'?source=curated':''}`;
export function groupGuidePages<T extends {source:string;id:string}>(pages:readonly {matching:T[];relevant:T[]}[]) {
 const matching=[...new Map(pages.flatMap(p=>p.matching).map(entry=>[guideIdentity(entry),entry])).values()],ids=new Set(matching.map(guideIdentity));
 return {matching,relevant:[...new Map(pages.flatMap(p=>p.relevant).filter(entry=>!ids.has(guideIdentity(entry))).map(entry=>[guideIdentity(entry),entry])).values()]};
}


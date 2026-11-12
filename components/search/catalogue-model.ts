export type CatalogueTitle = {id:string;title:string;subtitle:string;href:string};
export function catalogueGroups(suggestions:readonly string[],matching:readonly CatalogueTitle[],relevant:readonly CatalogueTitle[]) {
 const unique=(values:readonly CatalogueTitle[])=>[...new Map(values.map(value=>[value.id,value])).values()];
 const strong=unique(matching),ids=new Set(strong.map(item=>item.id));
 return {suggestions:[...new Set(suggestions.map(text=>text.trim()).filter(Boolean))].slice(0,4),matching:strong.slice(0,4),relevant:unique(relevant).filter(item=>!ids.has(item.id)).slice(0,3)};
}

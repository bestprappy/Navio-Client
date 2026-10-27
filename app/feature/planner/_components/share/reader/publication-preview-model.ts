import type { ReaderPresentation } from "./reader-model";

/** Local UI draft only. It is deliberately unrelated to the publication API. */
export type PublicationPreviewDraft = { excludedCatalogIds:string[];customDecisions:Record<string,boolean|null>;includedListIndexes:number[] };
export function initialPublicationPreview(presentation:ReaderPresentation):PublicationPreviewDraft {
  return {excludedCatalogIds:[],customDecisions:Object.fromEntries((presentation.vehicles??[]).filter(v=>v.source==="custom").map(v=>[v.id,null])),includedListIndexes:[]};
}
export function publicationPreviewReady(draft:PublicationPreviewDraft):boolean { return Object.values(draft.customDecisions).every(v=>v!==null); }
export function applyPublicationPreview(presentation:ReaderPresentation,draft:PublicationPreviewDraft):ReaderPresentation {
  return {...presentation,vehicles:presentation.vehicles?.filter(v=>v.source==="catalog"?!draft.excludedCatalogIds.includes(v.id):draft.customDecisions[v.id]===true),lists:presentation.lists?.filter((_,index)=>draft.includedListIndexes.includes(index))};
}

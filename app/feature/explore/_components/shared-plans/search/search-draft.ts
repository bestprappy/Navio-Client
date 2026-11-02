export type SearchDraft = { source: string; value: string };
export const requestText = (text: string) => text.trim().replace(/\s+/g, ' ');
/** A self-originated URL acknowledgement must not replace a newer raw edit. */
export function synchronizeDraft(draft: SearchDraft, query: string, ownQuery: string | null): SearchDraft {
 return { source: query, value: query === ownQuery ? draft.value : query };
}

"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

type CatalogSearchProps = {
  term: string;
  onSearch: (term: string) => void;
};

/** One search field: results update as the admin types, Enter applies at once. */
export function CatalogSearch({ term, onSearch }: CatalogSearchProps) {
  const [draft, setDraft] = useState(term);
  const [appliedTerm, setAppliedTerm] = useState(term);
  // Follow changes made outside the field (Clear filters, back navigation)
  // without clobbering a trailing space the admin is still typing.
  if (term !== appliedTerm) {
    setAppliedTerm(term);
    if (draft.trim() !== term) setDraft(term);
  }
  const onSearchRef = useRef(onSearch);
  useEffect(() => { onSearchRef.current = onSearch; }, [onSearch]);

  useEffect(() => {
    const next = draft.trim();
    if (next === term) return;
    const timer = window.setTimeout(() => onSearchRef.current(next), 300);
    return () => window.clearTimeout(timer);
  }, [draft, term]);

  return (
    <form role="search" aria-label="Search vehicle catalog" className="relative w-full sm:max-w-sm"
      onSubmit={(event) => { event.preventDefault(); onSearch(draft.trim()); }}>
      <label htmlFor="catalog-search" className="sr-only">Search make, model or trim</label>
      <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input id="catalog-search" type="search" value={draft} maxLength={100} placeholder="Search make, model or trim"
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => { if (event.key === "Escape" && draft) { event.preventDefault(); setDraft(""); } }}
        className="h-10 bg-card pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden" />
      {draft && <button type="button" aria-label="Clear search" onClick={() => { setDraft(""); onSearch(""); }}
        className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
        <X className="size-3.5" aria-hidden="true" />
      </button>}
    </form>
  );
}

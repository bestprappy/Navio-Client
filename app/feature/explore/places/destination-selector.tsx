"use client";
import { useEffect, useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchDestinationCoordinates, fetchDestinationSuggestions, type DestinationSuggestion } from "../../planner/_components/destination-api";
import type { DiscoveryDestination } from "./places-api";

export function DiscoveryDestinationSelector({ onSelect }: { onSelect: (destination: DiscoveryDestination) => void }) {
  const [text, setText] = useState("");
  const [term, setTerm] = useState("");
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const id = useId();
  useEffect(() => { const timer = setTimeout(() => setTerm(text.trim()), 350); return () => clearTimeout(timer); }, [text]);
  const query = useQuery({ queryKey: ["discovery-destination", term], queryFn: () => fetchDestinationSuggestions(term), enabled: open && term.length >= 2, retry: false });
  const choices = query.data || [];
  async function choose(choice: DestinationSuggestion) {
    setBusy(true); setError(null);
    try { const coordinates = choice.coordinates || await fetchDestinationCoordinates(choice.providerPlaceId, choice.provider); if (!coordinates) throw new Error("Could not locate this destination. Try again."); onSelect({ name: choice.mainText, ...coordinates }); setText(""); setOpen(false); }
    catch (error) { setError(error instanceof Error ? error.message : "Could not select destination."); }
    finally { setBusy(false); }
  }
  return <div className="relative min-w-48 flex-1"><label className="space-y-1.5 text-xs font-medium text-muted-foreground">Another destination<input role="combobox" aria-expanded={open && choices.length > 0} aria-controls={id} aria-autocomplete="list" aria-activedescendant={open && choices[active] ? `${id}-${active}` : undefined} value={text} disabled={busy} maxLength={120} placeholder="Choose a city or region" onFocus={() => setOpen(true)} onChange={event => { setText(event.target.value); setActive(0); setOpen(true); }} onKeyDown={event => { if (event.key === "Escape") setOpen(false); if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setOpen(true); setActive(value => Math.max(0, Math.min(choices.length - 1, value + (event.key === "ArrowDown" ? 1 : -1)))); } if (event.key === "Enter" && open && choices[active]) { event.preventDefault(); void choose(choices[active]); } }} className="block min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring" /></label>
    {open && term.length >= 2 && <div className="absolute inset-x-0 top-full z-40 mt-1 overflow-hidden rounded-xl border border-border bg-card shadow-xl"><ul id={id} role="listbox" aria-label="Destinations" className="max-h-72 overflow-y-auto">{choices.map((choice,index) => <li key={choice.providerPlaceId} role="option" aria-selected={index === active} id={`${id}-${index}`}><button type="button" disabled={busy} onMouseEnter={() => setActive(index)} onClick={() => void choose(choice)} className={`w-full px-3 py-3 text-left text-sm ${index === active ? "bg-primary/10" : "hover:bg-muted"}`}><span className="block font-medium">{choice.mainText}</span><span className="block text-xs text-muted-foreground">{choice.secondaryText}</span></button></li>)}</ul>{query.isFetching && <p role="status" className="p-3 text-xs">Finding destinations…</p>}{query.isSuccess && !choices.length && <p className="p-3 text-xs">No destination found.</p>}{query.isError && <p role="alert" className="p-3 text-xs">Destinations could not be loaded. Please try again.</p>}<button type="button" onClick={() => setOpen(false)} className="w-full border-t border-border py-2 text-xs">Close</button><p className="px-3 pb-2 text-[0.625rem] text-muted-foreground">Destination data from Google Maps</p></div>}
    {error && <p role="alert" className="mt-1 text-xs text-destructive">{error}</p>}
  </div>;
}

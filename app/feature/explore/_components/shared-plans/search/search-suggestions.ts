import type { ExplorePlan } from '../explore-plans-api';
import { durationDays, type PlanSearchState } from './search-state';
import { countries } from '../../../places/search-state';
import type { PlanDestinationSuggestion } from './search-api';
export type SearchDestination = Omit<PlanDestinationSuggestion, 'count'> & { count?: number };
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const aliases: Record<string, string[]> = { US: ['usa', 'united states of america'], GB: ['uk', 'britain', 'great britain'], KR: ['south korea'], TR: ['turkey'] };
const travelTopics = ['Road trip', 'EV trip', 'City break', 'Food trip', 'Scenic route', 'Weekend trip', 'Walking itinerary'];
/** General completions are independent of catalogue availability. Counts only come from the server. */
export function buildPlanSuggestions(text: string, country: string, remote: PlanDestinationSuggestion[]) {
 const query = normalize(text);
 if (query.length < 2) return { destinations: [] as SearchDestination[], queries: [] as string[] };
 const matches = (label: string) => normalize(label).split(' ').some((_, i, words) => words.slice(i).join(' ').startsWith(query));
 const local: SearchDestination[] = countries.filter(c => (!country || c.code === country) && (matches(c.name) || aliases[c.code]?.some(a => normalize(a).startsWith(query))))
  .map(c => ({ id: `country:${c.code}`, label: c.name, country: c.code, kind: 'country' }));
 const destinations = new Map<string, SearchDestination>();
 for (const item of [...local, ...remote.filter(d => (!country || d.country === country) && (matches(d.label) || local.some(c => c.id === d.id)))]) destinations.set(item.id, item);
 const ranked = [...destinations.values()].sort((a,b) => Number(!normalize(a.label).startsWith(query)) - Number(!normalize(b.label).startsWith(query)) || (b.count ?? 0) - (a.count ?? 0) || a.label.localeCompare(b.label)).slice(0,4);
 const firstCountry = ranked.find(d => d.kind === 'country');
 const queries = firstCountry ? [`${firstCountry.label} itinerary`, `${firstCountry.label} road trip`, `${firstCountry.label} weekend trip`] : travelTopics.filter(matches).slice(0,3);
 return { destinations: ranked, queries };
}

/** Already fetched public cards can complete titles immediately; the live endpoint expands coverage. */
export function matchKnownPlans(text: string, state: PlanSearchState, plans: ExplorePlan[]) {
 const query = normalize(text);
 if (query.length < 2) return [];
 const countryName = countries.find(c => c.code === state.country)?.name;
 const days = durationDays(state.duration, state.unit);
 const tokens = query.split(' ');
 return [...new Map(plans.map(plan => [plan.token, plan])).values()].filter(plan => {
  if (countryName && normalize(plan.destinationCountry || '') !== normalize(countryName)) return false;
  if (state.duration && (days === null || plan.dayCount !== days)) return false;
  const searchable = normalize([plan.title, plan.destinationCity, plan.destinationCountry].filter(Boolean).join(' '));
  return tokens.every(token => searchable.includes(token));
 }).sort((a,b) => Number(!normalize(a.title || '').startsWith(query)) - Number(!normalize(b.title || '').startsWith(query))).slice(0,4);
}

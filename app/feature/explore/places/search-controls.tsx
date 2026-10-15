"use client";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Globe2,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  countries,
  interests,
  months,
  placeTypes,
  seasons,
  timeLabel,
  type PlaceSearchState,
} from "./search-state";
import { suggestPlaces, type PlaceSuggestion } from "./explore-api";
import { GoogleAttribution } from "./google-attribution";

const control =
  "flex h-11 w-full min-w-0 items-center gap-2 rounded-xl border border-border/70 bg-card px-3 text-sm text-foreground shadow-none outline-none transition-colors hover:border-foreground/25 focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none";
const label = "mb-2 block text-xs font-medium text-muted-foreground";
const subscribe = (callback: () => void) => {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
};
export function usePlaceColumns() {
  return useSyncExternalStore(
    subscribe,
    () =>
      window.innerWidth >= 1280
        ? 4
        : window.innerWidth >= 1024
          ? 3
          : window.innerWidth >= 640
            ? 2
            : 1,
    () => 1,
  );
}
function useMobile() {
  return useSyncExternalStore(
    subscribe,
    () => window.innerWidth < 640,
    () => false,
  );
}
const normal = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

function CountrySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [active, setActive] = useState(0);
  const id = useId();
  const list = useRef<HTMLDivElement>(null);
  const options = [{ code: "", name: "Any country" }, ...countries].filter(
    (c) =>
      normal(c.name).includes(normal(text)) ||
      (c.code && c.code.toLowerCase().includes(text.toLowerCase())),
  );
  function choose(code: string) {
    onChange(code);
    setOpen(false);
  }
  useEffect(() => {
    list.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);
  return (
    <div className="min-w-0">
      <span id={`${id}-label`} className={label}>
        Country
      </span>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) {
            setText("");
            setActive(0);
          }
        }}
      >
        <PopoverTrigger
          aria-label={`Country: ${countries.find((c) => c.code === value)?.name || "Any country"}`}
          className={control}
        >
          <Globe2
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1 truncate text-left">
            {countries.find((c) => c.code === value)?.name || "Any country"}
          </span>
          <ChevronDown
            className="size-3.5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-80 max-w-[calc(100vw-2rem)] gap-0 rounded-2xl p-2"
        >
          <label className="relative m-1 mb-2">
            <span className="sr-only">Find a country</span>
            <Search
              className="absolute left-3 top-3.5 size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              value={text}
              role="combobox"
              aria-expanded="true"
              aria-controls={`${id}-list`}
              aria-autocomplete="list"
              aria-activedescendant={
                options[active] ? `${id}-${active}` : undefined
              }
              onChange={(e) => {
                setText(e.target.value);
                setActive(0);
              }}
              placeholder="Find a country"
              className={`${control} pl-9`}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((a) =>
                    Math.max(
                      0,
                      Math.min(
                        options.length - 1,
                        a + (e.key === "ArrowDown" ? 1 : -1),
                      ),
                    ),
                  );
                }
                if (e.key === "Enter" && options[active]) {
                  e.preventDefault();
                  choose(options[active].code);
                }
                if (e.key === "Escape") setOpen(false);
              }}
            />
          </label>
          <div
            ref={list}
            id={`${id}-list`}
            role="listbox"
            aria-label="Countries"
            className="max-h-72 overflow-y-auto overscroll-contain"
          >
            {options.map((c, i) => (
              <button
                type="button"
                key={c.code}
                id={`${id}-${i}`}
                data-index={i}
                role="option"
                aria-selected={c.code === value}
                tabIndex={-1}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(c.code)}
                className={`flex min-h-10 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${i === active ? "bg-muted" : "hover:bg-muted/60"}`}
              >
                <span className="flex-1">{c.name}</span>
                {value === c.code && (
                  <Check className="size-4 text-primary" aria-hidden="true" />
                )}
              </button>
            ))}
            {!options.length && (
              <p className="p-3 text-sm text-muted-foreground">
                No country matches that name.
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function PlaceSearchInput({
  state,
  onSubmit,
  onPlace,
}: {
  state: PlaceSearchState;
  onSubmit: (query: string, interest?: string) => void;
  onPlace: (id: string) => void;
}) {
  const [text, setText] = useState(state.query);
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const id = useId();
  const optionList = useRef<HTMLUListElement>(null);
  useEffect(() => {
    optionList.current
      ?.querySelector(`[id="${id}-option-${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active, id]);
  useEffect(() => {
    const timer = setTimeout(() => setTerm(text.trim()), 300);
    return () => clearTimeout(timer);
  }, [text]);
  const query = useQuery({
    queryKey: ["place-suggestions", term, state.country],
    queryFn: ({ signal }) => suggestPlaces(term, state.country, signal),
    enabled: open && term.length >= 2,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });
  const options = term === text.trim() ? query.data?.items || [] : [];
  function choose(option: PlaceSuggestion) {
    setOpen(false);
    setActive(-1);
    if (option.kind === "place" && option.placeId) onPlace(option.placeId);
    else onSubmit(option.value, option.interest || undefined);
  }
  return (
    <form
      className="relative min-w-0"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        setOpen(false);
        onSubmit(text.trim());
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <label htmlFor={id} className={label}>
        Search places
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          id={id}
          value={text}
          maxLength={200}
          placeholder="City, place, or something you love"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open && text.trim().length >= 2}
          aria-controls={`${id}-options`}
          aria-activedescendant={
            open && options[active] ? `${id}-option-${active}` : undefined
          }
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setText(e.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              setActive(-1);
            }
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              setOpen(true);
              setActive((a) =>
                Math.max(
                  -1,
                  Math.min(
                    options.length - 1,
                    a + (e.key === "ArrowDown" ? 1 : -1),
                  ),
                ),
              );
            }
            if (e.key === "Enter" && open && options[active]) {
              e.preventDefault();
              choose(options[active]);
            }
          }}
          className={`${control} pl-10 pr-20`}
        />
        <div className="absolute inset-y-0 right-1 flex items-center gap-0.5">
          {text && (
            <button
              type="button"
              aria-label="Clear place search"
              className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
              onClick={() => {
                setText("");
                onSubmit("");
                setOpen(false);
              }}
            >
              <X className="size-3.5" />
            </button>
          )}
          <button
            type="submit"
            aria-label="Search places"
            className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/15 focus-visible:outline-2 focus-visible:outline-ring"
          >
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
      {open && text.trim().length >= 2 && (
        <div className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border border-border bg-popover p-2 shadow-lg">
          <ul
            id={`${id}-options`}
            role="listbox"
            ref={optionList}
            aria-label="Search suggestions"
            className="max-h-72 overflow-y-auto"
          >
            {options.map((s, i) => (
              <li
                key={`${s.kind}-${s.placeId || s.value}-${s.interest}`}
                role="option"
                aria-selected={i === active}
                id={`${id}-option-${i}`}
              >
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(s)}
                  className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm ${i === active ? "bg-muted" : "hover:bg-muted/60"}`}
                >
                  <span className="min-w-0 break-words">{s.label}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {s.kind === "place" ? "Place" : "Search"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {query.isFetching && (
            <p
              role="status"
              className="px-3 py-2 text-xs text-muted-foreground"
            >
              Finding suggestions…
            </p>
          )}
          {(query.isError || query.data?.providerAvailable === false) && (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              Place suggestions are unavailable. You can still search.
            </p>
          )}
          {!query.isFetching && !options.length && (
            <button
              type="submit"
              className="w-full rounded-lg p-3 text-left text-sm hover:bg-muted"
            >
              Search for “{text.trim()}”
            </button>
          )}
          {query.data?.providerAvailable && (
            <div className="mt-2 border-t border-border px-3 pt-2">
              <GoogleAttribution />
            </div>
          )}
        </div>
      )}
    </form>
  );
}

function FilterSelect({
  state,
  onApply,
}: {
  state: PlaceSearchState;
  onApply: (changes: Partial<PlaceSearchState>) => void;
}) {
  const mobile = useMobile();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({
    interests: state.interests,
    types: state.types,
  });
  const id = useId();
  const count = state.interests.length + state.types.length;
  function changeOpen(next: boolean) {
    if (next) setDraft({ interests: state.interests, types: state.types });
    setOpen(next);
  }
  function toggle(key: "interests" | "types", value: string) {
    setDraft((d) => ({
      ...d,
      [key]: d[key].includes(value)
        ? d[key].filter((v) => v !== value)
        : [...d[key], value],
    }));
  }
  const content = (
    <>
      <div className="max-h-[60dvh] space-y-6 overflow-y-auto overscroll-contain p-1">
        {(
          [
            {
              key: "interests",
              title: "Discover by interest",
              description: "Choose sections to browse, or refine your search.",
              items: interests,
            },
            {
              key: "types",
              title: "Place types",
              description: "Choose one or more kinds of places to find.",
              items: placeTypes,
            },
          ] as const
        ).map((group) => (
          <fieldset key={group.key}>
            <legend className="text-sm font-semibold">{group.title}</legend>
            <p className="mb-3 mt-1 text-xs leading-5 text-muted-foreground">
              {group.description}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {group.items.map((option) => (
                <label
                  key={option.id}
                  className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-colors ${draft[group.key].includes(option.id) ? "border-primary/30 bg-primary/5 text-foreground" : "border-border/60 hover:bg-muted/50"}`}
                >
                  <input
                    type="checkbox"
                    checked={draft[group.key].includes(option.id)}
                    onChange={() => toggle(group.key, option.id)}
                    className="size-3.5 shrink-0 accent-(--primary)"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
        <button
          type="button"
          className="min-h-10 text-xs text-muted-foreground underline underline-offset-4"
          onClick={() => setDraft({ interests: [], types: [] })}
        >
          Clear filters
        </button>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onApply(draft);
              setOpen(false);
            }}
          >
            Apply filters
          </Button>
        </div>
      </div>
    </>
  );
  const trigger = (
    <button
      type="button"
      className={control}
      onClick={() => changeOpen(!open)}
      aria-expanded={open}
      aria-haspopup="dialog"
      aria-label={`Filters${count ? `, ${count} selected` : ""}`}
    >
      <SlidersHorizontal
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      <span className="flex-1 text-left">Filters</span>
      {count > 0 && (
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-medium text-primary">
          {count}
        </span>
      )}
      <ChevronDown
        className="size-3.5 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
    </button>
  );
  return (
    <div className="min-w-0">
      <span id={id} className={label}>
        Interests & place types
      </span>
      {mobile ? (
        <>
          <Sheet open={open} onOpenChange={changeOpen}>
            {trigger}
            <SheetContent
              side="bottom"
              className="max-h-[90dvh] rounded-t-3xl p-5"
            >
              <SheetHeader className="p-0">
                <SheetTitle>Find your kind of place</SheetTitle>
              </SheetHeader>
              {content}
            </SheetContent>
          </Sheet>
        </>
      ) : (
        <Popover open={open} onOpenChange={changeOpen}>
          <PopoverTrigger render={trigger} />
          <PopoverContent
            align="end"
            className="w-[25rem] max-w-[calc(100vw-2rem)] gap-0 rounded-2xl p-5"
          >
            <h2 className="mb-5 text-base font-semibold">
              Find your kind of place
            </h2>
            {content}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

export function PlaceSearchControls({
  state,
  onChange,
  onPlace,
}: {
  state: PlaceSearchState;
  onChange: (changes: Partial<PlaceSearchState>) => void;
  onPlace: (id: string) => void;
}) {
  const id = useId();
  return (
    <div className="space-y-4 border-y border-border/60 py-5 sm:py-6">
      <div className="grid min-w-0 grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(10rem,0.85fr)_minmax(16rem,2fr)_minmax(9rem,0.7fr)_minmax(12rem,0.9fr)]">
        <CountrySelect
          value={state.country}
          onChange={(country) => onChange({ country })}
        />
        <PlaceSearchInput
          key={state.query}
          state={state}
          onSubmit={(query, interest) =>
            onChange({ query, ...(interest ? { interests: [interest] } : {}) })
          }
          onPlace={onPlace}
        />
        <FilterSelect state={state} onApply={onChange} />
        <div className="min-w-0">
          <label htmlFor={id} className={label}>
            Month & season
          </label>
          <div className="relative">
            <select
              id={id}
              value={state.time}
              onChange={(e) => onChange({ time: e.target.value })}
              className={`${control} appearance-none pr-8`}
            >
              <option value="any">Any time</option>
              <optgroup label="Months">
                {months.map((m, i) => (
                  <option key={m} value={`month:${i + 1}`}>
                    Month: {m}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Seasons · regional coverage varies">
                {seasons.map((s) => (
                  <option key={s.id} value={`season:${s.id}`}>
                    Season: {s.label}
                  </option>
                ))}
              </optgroup>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-4 size-3.5 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
      {(state.interests.length > 0 ||
        state.types.length > 0 ||
        state.query) && (
        <div
          className="flex flex-wrap items-center gap-2"
          aria-label="Applied search filters"
        >
          {state.query && (
            <Chip
              label={`Search: ${state.query}`}
              remove={() => onChange({ query: "" })}
            />
          )}
          {state.interests.map((value) => (
            <Chip
              key={value}
              label={`Interest: ${interests.find((i) => i.id === value)?.label}`}
              remove={() =>
                onChange({
                  interests: state.interests.filter((i) => i !== value),
                })
              }
            />
          ))}
          {state.types.map((value) => (
            <Chip
              key={value}
              label={`Type: ${placeTypes.find((i) => i.id === value)?.label}`}
              remove={() =>
                onChange({ types: state.types.filter((i) => i !== value) })
              }
            />
          ))}
          <button
            type="button"
            className="min-h-9 px-1 text-xs text-muted-foreground underline underline-offset-4"
            onClick={() => onChange({ interests: [], types: [] })}
          >
            Clear filters
          </button>
        </div>
      )}
      <span className="sr-only" aria-live="polite">
        {countries.find((c) => c.code === state.country)?.name || "Any country"}
        , {timeLabel(state.time)}
      </span>
    </div>
  );
}
function Chip({ label, remove }: { label: string; remove: () => void }) {
  return (
    <button
      type="button"
      onClick={remove}
      className="inline-flex min-h-8 max-w-full items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-2.5 py-1 text-xs focus-visible:outline-2 focus-visible:outline-ring"
    >
      <span className="min-w-0 truncate">{label}</span>
      <X className="size-3 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="sr-only">Remove</span>
    </button>
  );
}

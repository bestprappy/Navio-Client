"use client";

import {
  type ChangeEvent,
  type KeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { MapPin } from "lucide-react";
import { useSetAtom } from "jotai";

import {
  getPlaceSuggestions,
  type PlaceSuggestion,
} from "../constants/place.data";
import {
  activeBlockIdAtom,
  startPlaceSearchAtom,
} from "../overview/trip-builder.atoms";
import { PlaceSearchDropdown } from "./place-search-dropdown";

type AddPlaceInputProps = {
  blockId: string;
};

export function AddPlaceInput({ blockId }: AddPlaceInputProps) {
  const generatedId = useId();
  const inputId = `place-search-${generatedId}`;
  const listboxId = `place-search-listbox-${generatedId}`;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [dropdownStyle, setDropdownStyle] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const setActiveBlockId = useSetAtom(activeBlockIdAtom);
  const startPlaceSearch = useSetAtom(startPlaceSearchAtom);
  const suggestions = useMemo(() => getPlaceSuggestions(query), [query]);
  const activeSuggestion = suggestions[activeIndex];

  useEffect(() => {
    if (!isDropdownOpen || !wrapperRef.current) return;

    function updatePosition() {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      setDropdownStyle({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isDropdownOpen]);

  function handleQueryChange(event: ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
    setActiveIndex(0);
    setIsDropdownOpen(true);
    setActiveBlockId(blockId);
  }

  function selectSuggestion(suggestion: PlaceSuggestion) {
    setQuery("");
    setActiveIndex(0);
    setIsDropdownOpen(false);
    startPlaceSearch({ blockId, suggestion });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setIsDropdownOpen(false);
      return;
    }

    if (!suggestions.length) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsDropdownOpen(true);
      setActiveIndex((currentIndex) =>
        currentIndex >= suggestions.length - 1 ? 0 : currentIndex + 1,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsDropdownOpen(true);
      setActiveIndex((currentIndex) =>
        currentIndex <= 0 ? suggestions.length - 1 : currentIndex - 1,
      );
      return;
    }

    if (event.key === "Enter" && isDropdownOpen && activeSuggestion) {
      event.preventDefault();
      selectSuggestion(activeSuggestion);
    }
  }

  const showDropdown = isDropdownOpen && query.trim() && dropdownStyle;

  return (
    <div
      ref={wrapperRef}
      className="relative min-w-0 flex-1"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsDropdownOpen(false);
        }
      }}
    >
      <div className="flex items-center gap-2 rounded-sm border border-border bg-background px-3 py-4 shadow-xs focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
        <MapPin
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-activedescendant={
            isDropdownOpen && activeSuggestion
              ? `${listboxId}-${activeSuggestion.id}`
              : undefined
          }
          aria-expanded={isDropdownOpen}
          value={query}
          placeholder="Add places"
          onChange={handleQueryChange}
          onFocus={() => {
            setIsDropdownOpen(true);
            setActiveBlockId(blockId);
          }}
          onKeyDown={handleKeyDown}
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>

      {showDropdown &&
        createPortal(
          <div
            style={{
              position: "absolute",
              top: dropdownStyle.top,
              left: dropdownStyle.left,
              width: dropdownStyle.width,
              zIndex: 9999,
            }}
          >
            <PlaceSearchDropdown
              activeIndex={activeIndex}
              inputId={inputId}
              listboxId={listboxId}
              suggestions={suggestions}
              onActiveIndexChange={setActiveIndex}
              onSelectSuggestion={selectSuggestion}
            />
          </div>,
          document.body,
        )}
    </div>
  );
}

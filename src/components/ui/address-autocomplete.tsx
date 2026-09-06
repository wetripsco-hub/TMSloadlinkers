"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Loader2, X } from "lucide-react";

export const US_STATE_MAP: Record<string, string> = {
  alabama: "AL",
  alaska: "AK",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  florida: "FL",
  georgia: "GA",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  virginia: "VA",
  washington: "WA",
  "west virginia": "WV",
  wisconsin: "WI",
  wyoming: "WY",
  "district of columbia": "DC",
};

export function getStateAbbreviation(stateName?: string | null): string {
  if (!stateName) return "";
  const trimmed = stateName.trim();
  if (trimmed.length === 2) return trimmed.toUpperCase();
  const lower = trimmed.toLowerCase();
  return US_STATE_MAP[lower] || trimmed;
}

export interface AddressSuggestion {
  city: string;
  state: string;
  stateCode: string;
  country: string;
  postcode?: string;
  street?: string;
  lat: number;
  lng: number;
  formattedText: string;
  displayName: string;
}

interface PhotonFeature {
  properties: {
    name?: string;
    city?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    postcode?: string;
    street?: string;
    housenumber?: string;
    type?: string;
  };
  geometry: {
    coordinates: [number, number]; // [lng, lat]
  };
}

export interface AddressAutocompleteProps {
  id?: string;
  value?: string;
  onChange?: (val: string) => void;
  onSelect?: (suggestion: AddressSuggestion) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  id,
  value: controlledValue,
  onChange,
  onSelect,
  placeholder = "e.g. Chicago, IL",
  required = false,
  disabled = false,
  className = "",
  error,
}) => {
  const [internalValue, setInternalValue] = useState("");
  const isControlled = controlledValue !== undefined;
  const query = isControlled ? controlledValue : internalValue;

  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const updateValue = useCallback(
    (newVal: string) => {
      if (!isControlled) {
        setInternalValue(newVal);
      }
      onChange?.(newVal);
    },
    [isControlled, onChange]
  );

  // Debounced search when query changes
  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 3) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      // Cancel prior pending fetch
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      try {
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=5`;
        const res = await fetch(url, { signal: abortControllerRef.current.signal });

        if (!res.ok) {
          throw new Error(`Photon returned ${res.status}`);
        }

        const data = await res.json();
        const features: PhotonFeature[] = data.features || [];

        const parsed: AddressSuggestion[] = features.map((f) => {
          const props = f.properties || {};
          const city = props.city || props.name || "";
          const rawState = props.state || "";
          const stateCode = getStateAbbreviation(rawState);
          const country = props.country || (props.countrycode ? props.countrycode.toUpperCase() : "USA");
          const postcode = props.postcode || "";
          const street = [props.housenumber, props.street].filter(Boolean).join(" ");
          const [lng, lat] = f.geometry.coordinates;

          const locationParts = [city, stateCode || rawState].filter(Boolean);
          const formattedText = locationParts.length > 0 ? locationParts.join(", ") : props.name || "";
          const displayName = [city, rawState, country].filter(Boolean).join(", ");

          return {
            city,
            state: rawState,
            stateCode,
            country,
            postcode,
            street,
            lat,
            lng,
            formattedText,
            displayName,
          };
        });

        setSuggestions(parsed);
        setIsOpen(parsed.length > 0);
        setHighlightedIndex(-1);
      } catch (err: unknown) {
        if ((err as { name?: string }).name !== "AbortError") {
          console.warn("Photon autocomplete request failed:", err);
          setSuggestions([]);
        }
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query]);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item: AddressSuggestion) => {
    updateValue(item.formattedText);
    onSelect?.(item);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        handleSelect(suggestions[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
          <MapPin className="h-4 w-4" />
        </div>

        <input
          id={id}
          type="text"
          value={query}
          onChange={(e) => updateValue(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete="off"
          className={`h-10 w-full rounded-lg border bg-white pl-9 pr-9 text-sm text-slate-900 shadow-xs transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 dark:bg-[#1f2937] dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-blue-400/20 ${
            error
              ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20"
              : "border-slate-300 focus:border-blue-500 dark:border-slate-700 dark:focus:border-blue-500"
          } ${className}`}
        />

        <div className="absolute inset-y-0 right-0 flex items-center pr-2.5">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          ) : query ? (
            <button
              type="button"
              onClick={() => {
                updateValue("");
                setSuggestions([]);
                setIsOpen(false);
              }}
              className="rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Clear input"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Sleek Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-[#1e293b]">
          {suggestions.map((item, index) => {
            const isHighlighted = index === highlightedIndex;
            return (
              <li
                key={`${item.city}-${item.state}-${item.lat}-${index}`}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`flex cursor-pointer items-start gap-2.5 px-3 py-2 text-xs transition-colors ${
                  isHighlighted
                    ? "bg-blue-50 text-blue-900 dark:bg-blue-950/60 dark:text-blue-100"
                    : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500 dark:text-blue-400" />
                <div className="flex flex-col min-w-0">
                  <div className="font-semibold text-slate-900 dark:text-white truncate">
                    {item.city || item.displayName}
                    {item.stateCode && (
                      <span className="ml-1 text-slate-500 font-normal">
                        ({item.stateCode})
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-400 truncate">
                    {[item.state, item.country, item.postcode].filter(Boolean).join(", ")}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default AddressAutocomplete;

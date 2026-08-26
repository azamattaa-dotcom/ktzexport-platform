'use client';
import { useEffect, useRef, useState } from 'react';

interface Props {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hasError?: boolean;
  inputClassName?: string;
}

const MAX_RESULTS = 50;
const DEFAULT_INPUT_CLASS = 'w-full border rounded-lg px-3 py-2 text-sm';

export default function StationAutocomplete({ options, value, onChange, placeholder, hasError, inputClassName }: Props) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => setQuery(value), [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery(value);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, value]);

  const filtered = (
    query.trim()
      ? options.filter((s) => s.toLowerCase().includes(query.trim().toLowerCase()))
      : options
  ).slice(0, MAX_RESULTS);

  function select(station: string) {
    onChange(station);
    setQuery(station);
    setIsOpen(false);
  }

  return (
    <div className="relative" ref={rootRef}>
      <input
        type="text"
        value={query}
        placeholder={placeholder}
        onFocus={() => setIsOpen(true)}
        onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
        className={`${inputClassName ?? DEFAULT_INPUT_CLASS} ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
      />
      {isOpen && (
        <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-400">Ничего не найдено</p>
          ) : (
            filtered.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => select(s)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-primary-50 transition-colors ${s === value ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'}`}
              >
                {s}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

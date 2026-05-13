import { useState, useRef, useEffect, useCallback } from 'react';
import { searchCountries, findCountry } from '../utils/countries';

interface Props {
  value: string;
  onChange: (alpha3: string) => void;
  className?: string;
}

export function CountryPicker({ value, onChange, className = '' }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = searchCountries(query);
  const selected = value ? findCountry(value) : undefined;

  const commit = useCallback(
    (alpha3: string) => {
      onChange(alpha3);
      setQuery('');
      setOpen(false);
      setHighlighted(0);
    },
    [onChange],
  );

  const clear = () => {
    onChange('');
    setQuery('');
    setOpen(false);
    inputRef.current?.focus();
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted(h => Math.min(h + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted(h => Math.max(h - 1, 0));
    } else if (e.key === 'Enter' && results[highlighted]) {
      e.preventDefault();
      commit(results[highlighted].alpha3);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  };

  useEffect(() => {
    if (listRef.current) {
      const item = listRef.current.children[highlighted] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlighted]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {selected && !open ? (
        <button
          type="button"
          onClick={() => {
            setQuery(selected.alpha3);
            setOpen(true);
            setTimeout(() => inputRef.current?.select(), 0);
          }}
          className="w-full flex items-center justify-between border border-gray-300 rounded px-2.5 py-1.5 text-sm bg-white hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
        >
          <span>
            <span className="font-mono font-semibold text-gray-800">{selected.alpha3}</span>
            <span className="ml-2 text-gray-500">{selected.name}</span>
          </span>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); clear(); }}
            className="text-gray-400 hover:text-gray-600 ml-2 leading-none"
            aria-label="Clear"
          >
            ×
          </button>
        </button>
      ) : (
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlighted(0);
          }}
          onFocus={() => {
            if (query || !selected) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={selected ? selected.alpha3 : 'Type country name or code…'}
          autoComplete="off"
          className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}

      {open && results.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg"
          role="listbox"
        >
          {results.map((country, i) => (
            <li
              key={country.alpha3}
              role="option"
              aria-selected={i === highlighted}
              onMouseDown={e => { e.preventDefault(); commit(country.alpha3); }}
              onMouseEnter={() => setHighlighted(i)}
              className={`flex items-center gap-3 px-3 py-2 cursor-pointer text-sm ${
                i === highlighted ? 'bg-blue-50 text-blue-900' : 'text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className="font-mono font-semibold w-9 shrink-0">{country.alpha3}</span>
              <span className="truncate">{country.name}</span>
            </li>
          ))}
        </ul>
      )}

      {open && query.length > 0 && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm text-gray-400">
          No countries match "{query}"
        </div>
      )}
    </div>
  );
}

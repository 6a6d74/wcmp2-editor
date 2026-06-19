import { useState, useRef, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import type { WcmpLink } from '../types/wcmp2';
import { LINK_RELATIONS, MIME_TYPES } from '../utils/vocabularies';
import { TestBadge, isHttpUrl, isValidUrl, testUrl, type TestResult } from './UrlTestBadge';

interface VocabItem { id: string; title: string }

export function RelationCombobox({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: VocabItem[];
}) {
  const [display, setDisplay] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const typedRef = useRef(value);
  const suppressRef = useRef(false);

  useEffect(() => { setDisplay(value); typedRef.current = value; }, [value]);

  const lowerTyped = typedRef.current.toLowerCase();
  const filtered = lowerTyped.length > 0
    ? options.filter(r => r.id.toLowerCase().startsWith(lowerTyped))
    : options;

  const commit = (id: string) => {
    typedRef.current = id;
    setDisplay(id);
    onChange(id);
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' || e.key === 'Delete') suppressRef.current = true;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setOpen(true);
        setActiveIdx(i => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIdx(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        if (open && filtered[activeIdx]) { e.preventDefault(); commit(filtered[activeIdx].id); }
        break;
      case 'Escape':
        setOpen(false);
        break;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const typed = e.target.value;
    const doComplete = !suppressRef.current && typed.length > 0;
    suppressRef.current = false;
    typedRef.current = typed;

    if (doComplete) {
      const match = options.find(r => r.id.toLowerCase().startsWith(typed.toLowerCase()));
      if (match && match.id !== typed) {
        setDisplay(match.id);
        requestAnimationFrame(() => inputRef.current?.setSelectionRange(typed.length, match.id.length));
        onChange(match.id);
        setOpen(true);
        setActiveIdx(0);
        return;
      }
    }

    setDisplay(typed);
    onChange(typed);
    setOpen(true);
    setActiveIdx(0);
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (listRef.current?.contains(e.relatedTarget as Node)) return;
    setOpen(false);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={display}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        autoComplete="off"
        spellCheck={false}
        placeholder="select"
        className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder-gray-400"
      />
      {open && filtered.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto"
        >
          {filtered.map((r, i) => (
            <button
              key={r.id}
              type="button"
              tabIndex={-1}
              onMouseDown={e => { e.preventDefault(); commit(r.id); }}
              className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                i === activeIdx ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {r.title !== r.id ? `${r.id} — ${r.title}` : r.id}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function mqttChannelError(v: string): string | null {
  if (!v) return null;
  if (v.startsWith('$')) return "Channel name must not start with '$' (reserved for system topics).";
  if (v.includes('+') || v.includes('#')) return "Channel name must not contain wildcard characters ('+' or '#').";
  if (/\u0000/.test(v)) return "Channel name must not contain null characters.";
  if (v.length > 65535) return "Channel name must not exceed 65,535 characters.";
  return null;
}

export function emptyLink(): WcmpLink {
  return { rel: '', href: '', type: '', title: '' };
}

export function LinkRow({
  link,
  onChange,
  onRemove,
  linkRelations = LINK_RELATIONS,
}: {
  link: WcmpLink;
  onChange: (link: WcmpLink) => void;
  onRemove: () => void;
  linkRelations?: VocabItem[];
}) {
  const [testResult, setTestResult] = useState<TestResult>({ status: 'idle' });

  const update = (field: keyof WcmpLink, value: string) => {
    onChange({ ...link, [field]: value });
    if (field === 'href') setTestResult({ status: 'idle' });
  };

  const doTest = async () => {
    setTestResult({ status: 'loading' });
    setTestResult(await testUrl(link.href));
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">
            Relation <span className="text-red-500">*</span>
          </label>
          <RelationCombobox
            value={link.rel}
            onChange={v => update('rel', v)}
            options={linkRelations}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">MIME type</label>
          <RelationCombobox
            value={link.type || ''}
            onChange={v => update('type', v)}
            options={MIME_TYPES.map(m => ({ id: m, title: m }))}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Title</label>
          <input
            type="text"
            value={link.title || ''}
            onChange={e => update('title', e.target.value)}
            placeholder="Human-readable label"
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-2 items-start">
        <div className="flex-1">
          <label className="text-xs font-medium text-gray-600 mb-1 block">
            URL <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={link.href}
            onChange={e => update('href', e.target.value)}
            placeholder="https://…"
            className={`w-full border rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 ${
              !isValidUrl(link.href)
                ? 'border-red-400 bg-red-50 focus:ring-red-400'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          {!isValidUrl(link.href) && (
            <p className="text-xs text-red-600 mt-1">Enter a valid URL including the protocol (e.g. https://example.org).</p>
          )}
          {testResult.status !== 'idle' && (
            <div className="mt-1">
              <TestBadge status={testResult.status} code={testResult.code} />
              {testResult.status === 'failed' && (
                <span className="text-xs text-gray-400 ml-1">— the server may not allow browser requests (CORS)</span>
              )}
            </div>
          )}
        </div>
        {isHttpUrl(link.href) && (
          <button
            type="button"
            onClick={doTest}
            disabled={testResult.status === 'loading'}
            title="Test URL (HTTP HEAD)"
            className="mt-5 px-2.5 py-1.5 text-xs rounded border border-gray-300 bg-white text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            Test
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="mt-5 text-red-400 hover:text-red-600 p-1.5 rounded"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/^(mqtt|mqtts|ws|wss):\/\//i.test(link.href || '') && (
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">MQTT channel</label>
          <input
            type="text"
            value={link.channel || ''}
            onChange={e => update('channel', e.target.value)}
            placeholder="origin/a/wis2/…"
            className={`w-full border rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 ${
              mqttChannelError(link.channel || '')
                ? 'border-red-400 bg-red-50 focus:ring-red-400'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          {mqttChannelError(link.channel || '') && (
            <p className="text-xs text-red-600 mt-1">{mqttChannelError(link.channel || '')}</p>
          )}
        </div>
      )}
    </div>
  );
}

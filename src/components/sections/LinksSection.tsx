import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { FormState } from '../../hooks/useWcmp2Form';
import type { WcmpLink } from '../../types/wcmp2';
import { LINK_RELATIONS, MIME_TYPES } from '../../utils/vocabularies';
import { SectionWrapper } from './SectionWrapper';

interface VocabItem { id: string; title: string }

interface Props {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  linkRelations?: VocabItem[];
}

function RelationCombobox({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: VocabItem[];
}) {
  const [display, setDisplay] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // Tracks what the user actually typed (vs the autocompleted tail shown in the input)
  const typedRef = useRef(value);
  // Prevents autocomplete on backspace/delete so the user can erase a suggestion
  const suppressRef = useRef(false);

  useEffect(() => { setDisplay(value); typedRef.current = value; }, [value]);

  // Filter against what was typed, not the autocompleted display value
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
        className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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

type TestStatus = 'idle' | 'loading' | 'ok' | 'redirect' | 'error' | 'failed';
interface TestResult { status: TestStatus; code?: number }

function emptyLink(): WcmpLink {
  return { rel: 'enclosure', href: '', type: '', title: '' };
}

function TestBadge({ result }: { result: TestResult }) {
  if (result.status === 'loading') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
        <Loader2 size={12} className="animate-spin" /> Testing…
      </span>
    );
  }
  if (result.status === 'ok') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-700">
        <CheckCircle size={12} /> OK {result.code && `(${result.code})`}
      </span>
    );
  }
  if (result.status === 'redirect') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-600">
        <AlertCircle size={12} /> Redirect {result.code && `(${result.code})`}
      </span>
    );
  }
  if (result.status === 'error') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-600">
        <XCircle size={12} /> Error {result.code && `(${result.code})`}
      </span>
    );
  }
  if (result.status === 'failed') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-600">
        <XCircle size={12} /> Could not connect
      </span>
    );
  }
  return null;
}

export function LinksSection({ form, update, linkRelations = LINK_RELATIONS }: Props) {
  const [testResults, setTestResults] = useState<Record<number, TestResult>>({});

  const setLinks = (links: WcmpLink[]) => update('links', links);

  const addLink = () => setLinks([...form.links, emptyLink()]);

  const updateLink = (i: number, field: keyof WcmpLink, value: string) => {
    const updated = [...form.links];
    updated[i] = { ...updated[i], [field]: value };
    setLinks(updated);
    // Clear stale test result when the URL changes
    if (field === 'href') {
      setTestResults(prev => { const next = { ...prev }; delete next[i]; return next; });
    }
  };

  const removeLink = (i: number) => {
    setLinks(form.links.filter((_, idx) => idx !== i));
    // Clear all results since indices shift after removal
    setTestResults({});
  };

  const testLink = async (href: string, index: number) => {
    if (!href) return;
    setTestResults(prev => ({ ...prev, [index]: { status: 'loading' } }));
    try {
      const res = await fetch(href, { method: 'HEAD' });
      const code = res.status;
      const status: TestStatus = code < 300 ? 'ok' : code < 400 ? 'redirect' : 'error';
      setTestResults(prev => ({ ...prev, [index]: { status, code } }));
    } catch {
      setTestResults(prev => ({ ...prev, [index]: { status: 'failed' } }));
    }
  };

  return (
    <SectionWrapper id="links" title="Links" required>
      <p className="text-sm text-gray-500 mb-4">
        At least one link is required. Add a <code className="bg-gray-100 px-1 rounded text-xs">preview</code> link
        for a thumbnail, and a <code className="bg-gray-100 px-1 rounded text-xs">license</code> link if data policy
        is "recommended".
      </p>

      <div className="space-y-3 mb-4">
        {form.links.map((link, i) => (
          <div
            key={i}
            className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-2"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* rel */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Relation <span className="text-red-500">*</span>
                </label>
                <RelationCombobox
                  value={link.rel}
                  onChange={v => updateLink(i, 'rel', v)}
                  options={linkRelations}
                />
              </div>

              {/* type */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">MIME type</label>
                <select
                  value={link.type || ''}
                  onChange={e => updateLink(i, 'type', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">— select —</option>
                  {MIME_TYPES.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* title */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Title</label>
                <input
                  type="text"
                  value={link.title || ''}
                  onChange={e => updateLink(i, 'title', e.target.value)}
                  placeholder="Human-readable label"
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* href */}
            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={link.href}
                  onChange={e => updateLink(i, 'href', e.target.value)}
                  placeholder="https://…"
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {testResults[i] && testResults[i].status !== 'idle' && (
                  <div className="mt-1">
                    <TestBadge result={testResults[i]} />
                    {testResults[i].status === 'failed' && (
                      <span className="text-xs text-gray-400 ml-1">
                        — the server may not allow browser requests (CORS)
                      </span>
                    )}
                  </div>
                )}
              </div>
              {/^https?:\/\//i.test(link.href) && (
                <button
                  type="button"
                  onClick={() => testLink(link.href, i)}
                  disabled={testResults[i]?.status === 'loading'}
                  title="Test URL (HTTP HEAD)"
                  className="mt-5 px-2.5 py-1.5 text-xs rounded border border-gray-300 bg-white text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Test
                </button>
              )}
              <button
                type="button"
                onClick={() => removeLink(i)}
                className="mt-5 text-red-400 hover:text-red-600 p-1.5 rounded"
              >
                <Trash2 size={15} />
              </button>
            </div>

            {/* MQTT channel field */}
            {link.href?.startsWith('mqtt') && (
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">MQTT channel</label>
                <input
                  type="text"
                  value={link.channel || ''}
                  onChange={e => updateLink(i, 'channel', e.target.value)}
                  placeholder="origin/a/wis2/…"
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addLink}
        className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors w-full justify-center"
      >
        <Plus size={16} /> Add link
      </button>
    </SectionWrapper>
  );
}

import { useState } from 'react';
import { Plus, Trash2, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { FormState } from '../../hooks/useWcmp2Form';
import type { WcmpLink } from '../../types/wcmp2';
import { LINK_RELATIONS, MIME_TYPES } from '../../utils/vocabularies';
import { SectionWrapper } from './SectionWrapper';

interface Props {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
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

export function LinksSection({ form, update }: Props) {
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
                <select
                  value={link.rel}
                  onChange={e => updateLink(i, 'rel', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {LINK_RELATIONS.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.id} — {r.title}
                    </option>
                  ))}
                </select>
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

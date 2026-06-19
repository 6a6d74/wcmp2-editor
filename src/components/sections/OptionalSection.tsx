import { useState } from 'react';
import { Plus, X, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { FormState } from '../../hooks/useWcmp2Form';
import type { ExternalId } from '../../types/wcmp2';
import { SectionWrapper } from './SectionWrapper';

interface Props {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}

const KNOWN_SCHEMES = [
  { label: 'DOI', url: 'https://doi.org' },
  { label: 'ARK', url: 'https://arks.org' },
  { label: 'HDL', url: 'https://handle.net' },
];

function schemeLabel(url: string): string {
  const known = KNOWN_SCHEMES.find(s => s.url === url);
  return known ? known.label : url;
}

const schemeUrlValid = (url: string) => !url || /^https?:\/\/.+/.test(url);

function pidValueError(schemeUrl: string, value: string): string | null {
  if (!value) return null;
  if (schemeUrl === 'https://doi.org') {
    return /^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/.test(value)
      ? null
      : 'Invalid DOI — expected format: 10.XXXX/suffix (e.g. 10.5065/D6FB50WB).';
  }
  if (schemeUrl === 'https://arks.org') {
    return /^ark:\/?[0-9]{5}\/[A-Za-z0-9]+(\/[A-Za-z0-9]+)*(\.[A-Za-z0-9]+)*$/.test(value)
      ? null
      : 'Invalid ARK — expected format: ark:/NNNNN/name (e.g. ark:/86071/d2xb84).';
  }
  if (schemeUrl === 'https://handle.net') {
    return /^[^/]+\/[^/]+$/.test(value)
      ? null
      : 'Invalid handle — expected format: prefix/suffix (e.g. hdl:1912/27242).';
  }
  return null;
}

type TestStatus = 'idle' | 'loading' | 'ok' | 'redirect' | 'error' | 'failed';

function TestBadge({ status, code }: { status: TestStatus; code?: number }) {
  if (status === 'loading') return <span className="inline-flex items-center gap-1 text-xs text-gray-500"><Loader2 size={12} className="animate-spin" /> Testing…</span>;
  if (status === 'ok') return <span className="inline-flex items-center gap-1 text-xs text-green-700"><CheckCircle size={12} /> OK {code && `(${code})`}</span>;
  if (status === 'redirect') return <span className="inline-flex items-center gap-1 text-xs text-amber-600"><AlertCircle size={12} /> Redirect {code && `(${code})`}</span>;
  if (status === 'error') return <span className="inline-flex items-center gap-1 text-xs text-red-600"><XCircle size={12} /> Error {code && `(${code})`}</span>;
  if (status === 'failed') return <span className="inline-flex items-center gap-1 text-xs text-red-600"><XCircle size={12} /> Could not connect</span>;
  return null;
}

export function OptionalSection({ form, update }: Props) {
  const [keyword, setKeyword] = useState('');
  const [pidSchemeUrl, setPidSchemeUrl] = useState('');
  const [pidValue, setPidValue] = useState('');
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testCode, setTestCode] = useState<number | undefined>();

  const addKeyword = () => {
    const kw = keyword.trim();
    if (kw && !form.keywords.includes(kw)) {
      update('keywords', [...form.keywords, kw]);
    }
    setKeyword('');
  };

  const removeKeyword = (kw: string) => update('keywords', form.keywords.filter(k => k !== kw));

  const removePid = (i: number) => {
    update('externalIds', form.externalIds.filter((_, idx) => idx !== i));
  };

  const valueError = pidValueError(pidSchemeUrl, pidValue);
  const canAdd = pidSchemeUrl.trim() && schemeUrlValid(pidSchemeUrl) && pidValue.trim() && !valueError;

  const addPid = () => {
    if (!canAdd) return;
    const newId: ExternalId = { scheme: pidSchemeUrl.trim(), value: pidValue.trim() };
    update('externalIds', [...form.externalIds, newId]);
    setPidValue('');
    setTestStatus('idle');
  };

  const testSchemeUrl = async () => {
    if (!pidSchemeUrl || !schemeUrlValid(pidSchemeUrl)) return;
    setTestStatus('loading');
    setTestCode(undefined);
    try {
      const res = await fetch(pidSchemeUrl, { method: 'HEAD' });
      const code = res.status;
      setTestCode(code);
      setTestStatus(code < 300 ? 'ok' : code < 400 ? 'redirect' : 'error');
    } catch {
      setTestStatus('failed');
    }
  };

  const handleSchemeChange = (url: string) => {
    setPidSchemeUrl(url);
    setTestStatus('idle');
    setTestCode(undefined);
  };

  return (
    <SectionWrapper id="optional" title="Optional Fields">
      <div className="space-y-6">
        {/* Keywords */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
          <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
            {form.keywords.map(kw => (
              <span
                key={kw}
                className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
              >
                {kw}
                <button type="button" onClick={() => removeKeyword(kw)} className="text-gray-400 hover:text-gray-700">
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }}
              placeholder="Type a keyword and press Enter"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={addKeyword}
              className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm text-gray-700"
            >
              <Plus size={14} /> Add
            </button>
          </div>
        </div>

        {/* Version */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Version / Edition</label>
          <input
            type="text"
            value={form.version}
            onChange={e => update('version', e.target.value)}
            placeholder="e.g. 1.0, v2024"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* External IDs / PIDs */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Persistent Identifiers{' '}
            <span className="text-xs font-normal text-gray-400">(improves KPI score)</span>
          </label>

          {form.externalIds.length > 0 && !form.links.some(l => l.rel === 'cite-as') && (
            <div className="flex items-start gap-2 mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
              <span className="mt-0.5">💡</span>
              <span>
                Add a link with relation <strong>cite-as</strong> in the Links section to indicate the preferred citation URL for this record.
              </span>
            </div>
          )}

          {form.externalIds.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {form.externalIds.map((pid, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-2"
                >
                  <span className="text-xs font-mono bg-gray-200 px-1.5 py-0.5 rounded uppercase shrink-0">
                    {schemeLabel(pid.scheme)}
                  </span>
                  <span className="text-sm text-gray-700 flex-1 font-mono truncate">{pid.value}</span>
                  <button
                    type="button"
                    onClick={() => removePid(i)}
                    className="text-red-400 hover:text-red-600 shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
            {/* Preset buttons */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-600">Scheme URL</label>
                {schemeUrlValid(pidSchemeUrl) && pidSchemeUrl && (
                  <a
                    href={pidSchemeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View scheme ↗
                  </a>
                )}
              </div>
              <div className="flex gap-2 mb-1.5">
                {KNOWN_SCHEMES.map(s => (
                  <button
                    key={s.url}
                    type="button"
                    onClick={() => handleSchemeChange(s.url)}
                    className={`text-xs px-2 py-1 rounded border transition-colors ${
                      pidSchemeUrl === s.url
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={pidSchemeUrl}
                  onChange={e => handleSchemeChange(e.target.value)}
                  placeholder="https://doi.org"
                  className={`flex-1 border rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 ${
                    pidSchemeUrl && !schemeUrlValid(pidSchemeUrl)
                      ? 'border-red-400 bg-red-50 focus:ring-red-400'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={testSchemeUrl}
                  disabled={!pidSchemeUrl || !schemeUrlValid(pidSchemeUrl) || testStatus === 'loading'}
                  className="px-2.5 py-1.5 text-xs rounded border border-gray-300 bg-white text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Test
                </button>
              </div>
              {pidSchemeUrl && !schemeUrlValid(pidSchemeUrl) && (
                <p className="text-xs text-red-600 mt-1">Scheme URL must be a valid http:// or https:// URL.</p>
              )}
              {testStatus !== 'idle' && (
                <div className="mt-1">
                  <TestBadge status={testStatus} code={testCode} />
                  {testStatus === 'failed' && (
                    <span className="text-xs text-gray-400 ml-1">— the server may not allow browser requests (CORS)</span>
                  )}
                </div>
              )}
            </div>

            {/* Value */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Identifier value</label>
              <input
                type="text"
                value={pidValue}
                onChange={e => setPidValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPid(); } }}
                placeholder={
                  pidSchemeUrl === 'https://doi.org' ? 'e.g. 10.5065/D6FB50WB' :
                  pidSchemeUrl === 'https://arks.org' ? 'e.g. ark:/12345/abc123' :
                  pidSchemeUrl === 'https://handle.net' ? 'e.g. 20.1000/123' :
                  'Identifier value'
                }
                className={`w-full border rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 ${
                  valueError
                    ? 'border-red-400 bg-red-50 focus:ring-red-400'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {valueError && (
                <p className="text-xs text-red-600 mt-1">{valueError}</p>
              )}
            </div>

            <button
              type="button"
              onClick={addPid}
              disabled={!canAdd}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-40"
            >
              <Plus size={14} /> Add identifier
            </button>
          </div>
        </div>

        {/* Rights */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rights / Copyright statement</label>
          <textarea
            value={form.rights}
            onChange={e => update('rights', e.target.value)}
            rows={2}
            placeholder="e.g. © Crown copyright 2026 — open government licence v3.0"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>
    </SectionWrapper>
  );
}

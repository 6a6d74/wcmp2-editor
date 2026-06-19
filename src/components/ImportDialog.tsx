import { useRef, useState } from 'react';
import { Upload, Link, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { validateAndParse } from '../utils/wcmp2Parser';
import type { FormState } from '../hooks/useWcmp2Form';

interface Props {
  onImport: (form: FormState, title: string) => void;
  onClose: () => void;
}

type Tab = 'file' | 'url';
type Status = 'idle' | 'loading' | 'success' | 'warning' | 'error';

export function ImportDialog({ onImport, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('file');
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<string[]>([]);
  const [parsedForm, setParsedForm] = useState<FormState | null>(null);
  const [recordTitle, setRecordTitle] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setStatus('idle');
    setErrors([]);
    setParsedForm(null);
    setRecordTitle('');
  }

  async function processJson(raw: unknown) {
    const { form, errors: errs } = validateAndParse(raw);
    if (form) {
      setParsedForm(form);
      setRecordTitle(form.title || form.id || 'Untitled record');
      if (errs.length > 0) {
        setErrors(errs);
        setStatus('warning');
      } else {
        setStatus('success');
      }
    } else {
      setErrors(errs);
      setStatus('error');
    }
  }

  function handleFile(file: File) {
    reset();
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      setErrors(['File must be a .json file.']);
      setStatus('error');
      return;
    }
    setStatus('loading');
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        processJson(parsed);
      } catch {
        setErrors(['Could not parse file as JSON.']);
        setStatus('error');
      }
    };
    reader.onerror = () => {
      setErrors(['Failed to read the file.']);
      setStatus('error');
    };
    reader.readAsText(file);
  }

  async function handleUrl() {
    if (!url.trim()) return;
    reset();
    setStatus('loading');
    try {
      const res = await fetch(url.trim());
      if (!res.ok) {
        setErrors([`Server returned ${res.status} ${res.statusText}.`]);
        setStatus('error');
        return;
      }
      const json = await res.json();
      await processJson(json);
    } catch (e) {
      const msg =
        e instanceof TypeError && e.message.includes('Failed to fetch')
          ? 'Could not fetch the URL. The server may not allow cross-origin requests (CORS).'
          : `Fetch failed: ${(e as Error).message}`;
      setErrors([msg]);
      setStatus('error');
    }
  }

  const tabClass = (t: Tab) =>
    `flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
      tab === t
        ? 'border-blue-600 text-blue-700'
        : 'border-transparent text-gray-500 hover:text-gray-700'
    }`;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Import existing record</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-1">
          <button className={tabClass('file')} onClick={() => { setTab('file'); reset(); }}>
            <Upload size={14} /> Upload file
          </button>
          <button className={tabClass('url')} onClick={() => { setTab('url'); reset(); }}>
            <Link size={14} /> From URL
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          {tab === 'file' && (
            <div>
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) handleFile(file);
                }}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <Upload size={28} className="mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  Drag and drop a <span className="font-medium">.json</span> file here, or{' '}
                  <span className="text-blue-600 font-medium">click to browse</span>
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                  e.target.value = '';
                }}
              />
            </div>
          )}

          {tab === 'url' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  URL to WCMP2 JSON record
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={e => { setUrl(e.target.value); reset(); }}
                    onKeyDown={e => e.key === 'Enter' && handleUrl()}
                    placeholder="https://example.org/metadata/record.json"
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleUrl}
                    disabled={!url.trim() || status === 'loading'}
                    className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                  >
                    Load
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Status feedback */}
          {status === 'loading' && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader size={15} className="animate-spin" /> Processing…
            </div>
          )}

          {status === 'success' && parsedForm && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 flex items-start gap-3">
              <CheckCircle size={18} className="text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800">Valid WCMP2 record</p>
                <p className="text-xs text-green-700 mt-0.5 truncate max-w-xs">{recordTitle}</p>
              </div>
            </div>
          )}

          {status === 'warning' && parsedForm && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
              <div className="flex items-start gap-2 mb-1">
                <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm font-medium text-amber-800">
                  Record has {errors.length === 1 ? '1 validation issue' : `${errors.length} validation issues`} — you can still import it
                </p>
              </div>
              <ul className="mt-1.5 space-y-1 pl-5 list-disc">
                {errors.map((e, i) => (
                  <li key={i} className="text-xs text-amber-700">{e}</li>
                ))}
              </ul>
            </div>
          )}

          {status === 'error' && errors.length > 0 && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <div className="flex items-start gap-2 mb-1">
                <AlertCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
                <p className="text-sm font-medium text-red-800">
                  {errors.length === 1 ? 'Not a valid WCMP2 record' : `${errors.length} validation errors`}
                </p>
              </div>
              <ul className="mt-1.5 space-y-1 pl-5 list-disc">
                {errors.map((e, i) => (
                  <li key={i} className="text-xs text-red-700">{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-sm text-gray-600 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => parsedForm && onImport(parsedForm, recordTitle)}
            disabled={!parsedForm}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium transition-colors"
          >
            Load into editor
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { FormState } from '../../hooks/useWcmp2Form';
import type { ExternalId } from '../../types/wcmp2';
import { SectionWrapper } from './SectionWrapper';

interface Props {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}

const PID_SCHEMES = ['doi', 'ark', 'hdl'];

export function OptionalSection({ form, update }: Props) {
  const [keyword, setKeyword] = useState('');
  const [pidScheme, setPidScheme] = useState('doi');
  const [pidValue, setPidValue] = useState('');

  const addKeyword = () => {
    const kw = keyword.trim();
    if (kw && !form.keywords.includes(kw)) {
      update('keywords', [...form.keywords, kw]);
    }
    setKeyword('');
  };

  const removeKeyword = (kw: string) => update('keywords', form.keywords.filter(k => k !== kw));

  const addPid = () => {
    if (pidValue.trim()) {
      const newId: ExternalId = { scheme: pidScheme, value: pidValue.trim() };
      update('externalIds', [...form.externalIds, newId]);
      setPidValue('');
    }
  };

  const removePid = (i: number) => {
    update('externalIds', form.externalIds.filter((_, idx) => idx !== i));
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
          {form.externalIds.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {form.externalIds.map((pid, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-2"
                >
                  <span className="text-xs font-mono bg-gray-200 px-1.5 py-0.5 rounded uppercase">
                    {pid.scheme}
                  </span>
                  <span className="text-sm text-gray-700 flex-1 font-mono truncate">{pid.value}</span>
                  <button
                    type="button"
                    onClick={() => removePid(i)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <select
              value={pidScheme}
              onChange={e => setPidScheme(e.target.value)}
              className="border border-gray-300 rounded-md px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {PID_SCHEMES.map(s => (
                <option key={s} value={s}>{s.toUpperCase()}</option>
              ))}
            </select>
            <input
              type="text"
              value={pidValue}
              onChange={e => setPidValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPid(); } }}
              placeholder="e.g. 10.5065/D6FB50WB"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={addPid}
              className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm text-gray-700"
            >
              <Plus size={14} /> Add
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
            placeholder="e.g. © Crown copyright 2024 — open government licence v3.0"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>
    </SectionWrapper>
  );
}

import { useMemo } from 'react';
import type { FormState } from '../../hooks/useWcmp2Form';
import { TEMPORAL_RESOLUTIONS } from '../../utils/vocabularies';
import { SectionWrapper } from './SectionWrapper';

const DEFAULT_ADDITIONAL_EXTENTS = JSON.stringify(
  {
    temporal: {
      interval: [['2000-01-01T00:00:00Z', '..']],
      resolution: 'PT1H',
      trs: 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian',
    },
  },
  null,
  2,
);

interface Props {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}

export function TemporalSection({ form, update }: Props) {
  const jsonValid = useMemo(() => {
    if (!form.additionalExtentsJson.trim()) return true;
    try { JSON.parse(form.additionalExtentsJson); return true; } catch { return false; }
  }, [form.additionalExtentsJson]);

  return (
    <SectionWrapper id="temporal" title="Temporal Extent">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Extent type</label>
          <div className="flex flex-wrap gap-2">
            {(['none', 'date', 'timestamp', 'interval'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => update('timeType', t)}
                className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                  form.timeType === t
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {t === 'none' ? 'No temporal extent' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {form.timeType === 'date' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={form.timeDate}
              onChange={e => update('timeDate', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {form.timeType === 'timestamp' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timestamp (ISO 8601)</label>
            <input
              type="datetime-local"
              value={form.timeTimestamp}
              onChange={e => update('timeTimestamp', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {form.timeType === 'interval' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Begin</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.timeBegin === '..' ? '' : form.timeBegin}
                    disabled={form.timeBegin === '..'}
                    onChange={e => update('timeBegin', e.target.value)}
                    placeholder="e.g. 2000-01-01T00:00:00Z or T00Z"
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 font-mono"
                  />
                  <label className="flex items-center gap-1.5 text-sm text-gray-600 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={form.timeBegin === '..'}
                      onChange={e => update('timeBegin', e.target.checked ? '..' : '')}
                      className="w-3.5 h-3.5"
                    />
                    Open
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.timeEnd === '..' ? '' : form.timeEnd}
                    disabled={form.timeEnd === '..'}
                    onChange={e => update('timeEnd', e.target.value)}
                    placeholder="e.g. 2026-12-31T23:59:59Z or T23Z"
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 font-mono"
                  />
                  <label className="flex items-center gap-1.5 text-sm text-gray-600 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={form.timeEnd === '..'}
                      onChange={e => update('timeEnd', e.target.checked ? '..' : '')}
                      className="w-3.5 h-3.5"
                    />
                    Open
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temporal Resolution{' '}
                <span className="text-xs font-normal text-gray-400">(ISO 8601 duration)</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={form.temporalResolution}
                  onChange={e => update('temporalResolution', e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— select or type below —</option>
                  {TEMPORAL_RESOLUTIONS.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.title} ({r.id})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={form.temporalResolution}
                  onChange={e => update('temporalResolution', e.target.value)}
                  placeholder="e.g. PT1H"
                  className="w-28 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Additional temporal extents ─────────────────────────────── */}
        <div className="pt-1 border-t border-gray-100">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.includeAdditionalExtents}
              onChange={e => {
                const checked = e.target.checked;
                update('includeAdditionalExtents', checked);
                if (checked && !form.additionalExtentsJson.trim()) {
                  update('additionalExtentsJson', DEFAULT_ADDITIONAL_EXTENTS);
                }
              }}
              className="w-4 h-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm font-medium text-gray-700">
              Include additional temporal extents (<code className="text-xs bg-gray-100 px-1 rounded">additionalExtents</code>)
            </span>
          </label>

          {form.includeAdditionalExtents && (
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Edit JSON directly. The object will be written verbatim to <code className="bg-gray-100 px-1 rounded">additionalExtents</code>.</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                  jsonValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {jsonValid ? 'Valid JSON' : 'Invalid JSON'}
                </span>
              </div>
              <textarea
                value={form.additionalExtentsJson}
                onChange={e => update('additionalExtentsJson', e.target.value)}
                rows={10}
                spellCheck={false}
                className={`w-full font-mono text-xs border rounded-md px-3 py-2 focus:outline-none focus:ring-2 resize-y ${
                  jsonValid
                    ? 'border-gray-300 focus:ring-blue-500'
                    : 'border-red-400 focus:ring-red-400 bg-red-50'
                }`}
              />
              {!jsonValid && (
                <p className="text-xs text-red-600">
                  Fix the JSON syntax errors above — invalid JSON will not be included in the exported record.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </SectionWrapper>
  );
}

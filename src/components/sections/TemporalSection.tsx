import type { FormState } from '../../hooks/useWcmp2Form';
import { TEMPORAL_RESOLUTIONS } from '../../utils/vocabularies';
import { SectionWrapper } from './SectionWrapper';

interface Props {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}

export function TemporalSection({ form, update }: Props) {
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
                    type="date"
                    value={form.timeBegin === '..' ? '' : form.timeBegin}
                    disabled={form.timeBegin === '..'}
                    onChange={e => update('timeBegin', e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
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
                    type="date"
                    value={form.timeEnd === '..' ? '' : form.timeEnd}
                    disabled={form.timeEnd === '..'}
                    onChange={e => update('timeEnd', e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
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
      </div>
    </SectionWrapper>
  );
}

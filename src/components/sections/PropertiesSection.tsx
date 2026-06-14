import type { FormState } from '../../hooks/useWcmp2Form';
import { RESOURCE_TYPES, OPERATIONAL_STATUSES } from '../../utils/vocabularies';
import { SectionWrapper } from './SectionWrapper';

interface Props {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  resourceTypes?: { id: string; title: string }[];
}

export function PropertiesSection({ form, update, resourceTypes = RESOURCE_TYPES }: Props) {
  const titleLen = form.title.length;
  const descLen = form.description.length;

  return (
    <SectionWrapper id="properties" title="Core Properties" required>
      <div className="space-y-4">
        {/* Resource type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Resource Type <span className="text-red-500">*</span>
          </label>
          <select
            value={form.resourceType}
            onChange={e => update('resourceType', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {resourceTypes.map(t => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={e => update('title', e.target.value)}
            placeholder="A concise, human-readable name for this dataset"
            maxLength={200}
            className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              titleLen > 150 ? 'border-amber-400' : 'border-gray-300'
            }`}
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-400">
              Use sentence case. Aim for 3+ words, ≤150 characters.
            </span>
            <span className={`text-xs ${titleLen > 150 ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
              {titleLen}/150
            </span>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.description}
            onChange={e => update('description', e.target.value)}
            rows={5}
            placeholder="A free-text summary of the dataset: what it contains, coverage, purpose, and any access constraints."
            className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y ${
              descLen > 0 && descLen < 16
                ? 'border-amber-400'
                : descLen > 2048
                ? 'border-red-400'
                : 'border-gray-300'
            }`}
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-400">
              16–2048 characters. No HTML markup.
            </span>
            <span
              className={`text-xs ${
                descLen < 16 && descLen > 0
                  ? 'text-amber-600 font-medium'
                  : descLen > 2048
                  ? 'text-red-600 font-medium'
                  : 'text-gray-400'
              }`}
            >
              {descLen}/2048
            </span>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>

          {/* Preset buttons */}
          <div className="flex flex-wrap gap-2 mb-3">
            {OPERATIONAL_STATUSES.map(s => {
              const selected = form.status?.id === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() =>
                    update('status', selected ? {} : { ...form.status, id: s.id, url: s.url })
                  }
                  className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${
                    selected
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                >
                  {s.title}
                </button>
              );
            })}
          </div>

          {/* Description of selected preset */}
          {(() => {
            const preset = OPERATIONAL_STATUSES.find(s => s.id === form.status?.id);
            return preset ? (
              <p className="text-xs text-gray-500 italic mb-3">{preset.description}</p>
            ) : null;
          })()}

          {/* Editable fields */}
          <div className="space-y-2">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">ID</label>
              <input
                type="text"
                value={form.status?.id || ''}
                onChange={e => update('status', { ...form.status, id: e.target.value })}
                placeholder="e.g. operational"
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Title <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={form.status?.title || ''}
                onChange={e => update('status', { ...form.status, title: e.target.value })}
                placeholder="Human-readable label"
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                URL <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={form.status?.url || ''}
                onChange={e => update('status', { ...form.status, url: e.target.value })}
                placeholder="https://codes.wmo.int/wis/operational"
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}

import type { FormState } from '../../hooks/useWcmp2Form';
import { RESOURCE_TYPES } from '../../utils/vocabularies';
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <input
            type="text"
            value={form.status?.id || ''}
            onChange={e => update('status', { ...form.status, id: e.target.value })}
            placeholder="e.g. operational, deprecated, experimental"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </SectionWrapper>
  );
}

import { useState } from 'react';
import type { FormState } from '../../hooks/useWcmp2Form';
import { RESOURCE_TYPES, OPERATIONAL_STATUSES } from '../../utils/vocabularies';
import { SectionWrapper } from './SectionWrapper';
import { TestBadge, isHttpUrl, isValidHttpUrl, testUrl, type TestResult } from '../UrlTestBadge';

interface Props {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  resourceTypes?: { id: string; title: string }[];
}

export function PropertiesSection({ form, update, resourceTypes = RESOURCE_TYPES }: Props) {
  const titleLen = form.title.length;
  const descLen = form.description.length;
  const [statusUrlTest, setStatusUrlTest] = useState<TestResult>({ status: 'idle' });

  const handleStatusUrlChange = (url: string) => {
    update('status', { ...form.status, url });
    setStatusUrlTest({ status: 'idle' });
  };

  const testStatusUrl = async () => {
    const url = form.status?.url || '';
    setStatusUrlTest({ status: 'loading' });
    setStatusUrlTest(await testUrl(url));
  };

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
                    update('status', selected ? {} : { ...form.status, id: s.id, title: s.presetTitle, url: s.url })
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
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.status?.title !== undefined}
                  onChange={e => update('status', { ...form.status, title: e.target.checked ? '' : undefined })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Title
              </label>
              {form.status?.title !== undefined && (
                <input
                  type="text"
                  value={form.status.title}
                  onChange={e => update('status', { ...form.status, title: e.target.value })}
                  placeholder="Human-readable label"
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.status?.url !== undefined}
                  onChange={e => update('status', { ...form.status, url: e.target.checked ? '' : undefined })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                URL
              </label>
              {form.status?.url !== undefined && (
                <>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={form.status.url}
                      onChange={e => handleStatusUrlChange(e.target.value)}
                      placeholder="https://codes.wmo.int/wis/operational-status/operational"
                      className={`flex-1 border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 ${
                        form.status.url && !isValidHttpUrl(form.status.url)
                          ? 'border-red-400 bg-red-50 focus:ring-red-400'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={testStatusUrl}
                      disabled={!isHttpUrl(form.status.url || '') || statusUrlTest.status === 'loading'}
                      className="px-2.5 py-1.5 text-xs rounded border border-gray-300 bg-white text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      Test
                    </button>
                  </div>
                  {form.status.url && !isValidHttpUrl(form.status.url) && (
                    <p className="text-xs text-red-600 mt-1">URL must be a valid http:// or https:// URL.</p>
                  )}
                  {form.status.url?.startsWith('https://codes.wmo.int/wis/operational-status') && (
                    <p className="text-xs text-blue-600 mt-1">
                      The Operational Status code list is awaiting publication to the WMO Codes Registry — URLs do not yet resolve.
                    </p>
                  )}
                  {statusUrlTest.status !== 'idle' && (
                    <div className="mt-1">
                      <TestBadge status={statusUrlTest.status} code={statusUrlTest.code} />
                      {statusUrlTest.status === 'failed' && (
                        <span className="text-xs text-gray-400 ml-1">— the server may not allow browser requests (CORS)</span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}

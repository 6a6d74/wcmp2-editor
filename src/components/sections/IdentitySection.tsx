import { RefreshCw } from 'lucide-react';
import type { FormState } from '../../hooks/useWcmp2Form';
import { SectionWrapper } from './SectionWrapper';

interface Props {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}

function generateLocalId() {
  return `rec-${Date.now().toString(36)}`;
}

export function IdentitySection({ form, update }: Props) {
  return (
    <SectionWrapper id="identity" title="Identity" required>
      <p className="text-sm text-gray-500 mb-4">
        The record identifier must follow the pattern{' '}
        <code className="bg-gray-100 px-1 rounded text-xs">urn:wmo:md:&#123;centre_id&#125;:&#123;local_id&#125;</code>.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Centre ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.centreId}
            onChange={e => update('centreId', e.target.value)}
            placeholder="e.g. ca-eccc-msc"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            From{' '}
            <a
              href="https://codes.wmo.int/wis/topic-hierarchy/centre-id"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline"
            >
              codes.wmo.int
            </a>
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Local Identifier <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={form.localId}
              onChange={e => update('localId', e.target.value)}
              placeholder="e.g. synop-canada-2024"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              title="Generate a random local ID"
              onClick={() => update('localId', generateLocalId())}
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-500"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full Record ID
        </label>
        <div className="font-mono text-sm bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-700 break-all min-h-[38px]">
          {form.id || (
            <span className="text-gray-400 italic">Fill Centre ID and Local ID above</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Created <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={form.created}
            onChange={e => update('created', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Updated</label>
          <input
            type="date"
            value={form.updated}
            onChange={e => update('updated', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </SectionWrapper>
  );
}

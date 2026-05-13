import type { FormState } from '../../hooks/useWcmp2Form';
import { SectionWrapper } from './SectionWrapper';

interface Props {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}

const POLICIES = [
  {
    id: 'core' as const,
    title: 'Core',
    description:
      'Freely and openly shared without restriction (WMO Resolution 1). No licence link required.',
    color: 'border-green-400 bg-green-50',
    badge: 'bg-green-100 text-green-800',
  },
  {
    id: 'recommended' as const,
    title: 'Recommended',
    description:
      'Shared with conditions of use. A licence link (rel="license") is required in the Links section.',
    color: 'border-amber-400 bg-amber-50',
    badge: 'bg-amber-100 text-amber-800',
  },
];

export function DataPolicySection({ form, update }: Props) {
  const isRecommended = form.dataPolicy === 'recommended';
  const hasLicenseLink = form.links.some(l => l.rel === 'license');

  return (
    <SectionWrapper id="datapolicy" title="Data Policy" required>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {POLICIES.map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => update('dataPolicy', p.id)}
            className={`text-left p-4 rounded-lg border-2 transition-all ${
              form.dataPolicy === p.id ? p.color : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  form.dataPolicy === p.id ? 'border-blue-600' : 'border-gray-400'
                }`}
              >
                {form.dataPolicy === p.id && (
                  <span className="w-2 h-2 rounded-full bg-blue-600 block" />
                )}
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded ${p.badge}`}
              >
                {p.title}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">{p.description}</p>
          </button>
        ))}
      </div>

      {isRecommended && !hasLicenseLink && (
        <div className="flex gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <span className="text-amber-600 text-lg leading-none">⚠</span>
          <div className="text-sm text-amber-800">
            <strong>Licence link required.</strong> Add a link with{' '}
            <code className="bg-amber-100 px-1 rounded text-xs">rel="license"</code> in the{' '}
            <strong>Links</strong> section below to indicate the terms of use.
          </div>
        </div>
      )}

      {isRecommended && hasLicenseLink && (
        <div className="flex gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          <span>✓</span> Licence link found in the Links section.
        </div>
      )}
    </SectionWrapper>
  );
}

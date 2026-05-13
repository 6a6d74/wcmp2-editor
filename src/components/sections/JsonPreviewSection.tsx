import { useState } from 'react';
import { Copy, ChevronDown, ChevronUp, Check } from 'lucide-react';
import type { Wcmp2Record } from '../../types/wcmp2';
import { SectionWrapper } from './SectionWrapper';

interface Props {
  record: Wcmp2Record;
}

export function JsonPreviewSection({ record }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(record, null, 2);

  const copy = async () => {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SectionWrapper id="preview" title="JSON Preview">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">
          Live view of the metadata record that will be exported.
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
          >
            {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            {open ? <><ChevronUp size={15} />Collapse</> : <><ChevronDown size={15} />Expand</>}
          </button>
        </div>
      </div>

      {open ? (
        <pre className="bg-gray-900 text-green-300 text-xs font-mono rounded-lg p-4 overflow-auto max-h-[500px] whitespace-pre-wrap break-all">
          {json}
        </pre>
      ) : (
        <pre className="bg-gray-900 text-green-300 text-xs font-mono rounded-lg p-4 overflow-hidden max-h-32 relative whitespace-pre-wrap break-all">
          {json}
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-gray-900 to-transparent" />
        </pre>
      )}
    </SectionWrapper>
  );
}

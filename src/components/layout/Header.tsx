import { Download, ShieldCheck, RotateCcw } from 'lucide-react';

interface HeaderProps {
  onValidate: () => void;
  onDownload: () => void;
  onReset: () => void;
  validating: boolean;
}

export function Header({ onValidate, onDownload, onReset, validating }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-blue-900 text-white shadow-lg h-14 flex items-center px-4 gap-3">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-lg font-bold tracking-tight whitespace-nowrap">WCMP2 Editor</span>
        <span className="hidden sm:block text-blue-300 text-sm truncate">
          WMO Core Metadata Profile v2
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onReset}
          title="Reset form"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-800 hover:bg-blue-700 text-sm font-medium transition-colors"
        >
          <RotateCcw size={14} />
          <span className="hidden sm:inline">Reset</span>
        </button>
        <button
          onClick={onValidate}
          disabled={validating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-sm font-medium text-black transition-colors"
        >
          <ShieldCheck size={14} />
          <span>{validating ? 'Validating…' : 'Validate'}</span>
        </button>
        <button
          onClick={onDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-green-500 hover:bg-green-400 text-sm font-medium text-black transition-colors"
        >
          <Download size={14} />
          <span>Download JSON</span>
        </button>
      </div>
    </header>
  );
}

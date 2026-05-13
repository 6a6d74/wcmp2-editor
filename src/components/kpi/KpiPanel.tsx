import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { KpiSummary } from '../../utils/kpiScorer';

const GRADE_BG: Record<string, string> = {
  A: 'bg-green-100 text-green-800',
  B: 'bg-lime-100 text-lime-800',
  C: 'bg-yellow-100 text-yellow-800',
  D: 'bg-orange-100 text-orange-800',
  E: 'bg-red-100 text-red-700',
  F: 'bg-red-200 text-red-800',
};

const BAR_COLOR: Record<string, string> = {
  A: 'bg-green-500',
  B: 'bg-lime-500',
  C: 'bg-yellow-400',
  D: 'bg-orange-400',
  E: 'bg-red-400',
  F: 'bg-red-600',
};

interface Props {
  kpi: KpiSummary;
}

export function KpiPanel({ kpi }: Props) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-800">Metadata Quality Score</span>
          <span
            className={`px-2 py-0.5 rounded text-sm font-bold ${GRADE_BG[kpi.grade] || 'bg-gray-100 text-gray-700'}`}
          >
            {kpi.grade} — {kpi.percentage}%
          </span>
        </div>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div className="divide-y divide-gray-100">
          {kpi.results.map(r => {
            const pct = r.maxScore > 0 ? (r.score / r.maxScore) * 100 : 0;
            const grade = pct >= 80 ? 'A' : pct >= 65 ? 'B' : pct >= 50 ? 'C' : pct >= 35 ? 'D' : pct >= 20 ? 'E' : 'F';
            return (
              <div key={r.id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{r.name}</span>
                  <span className="text-xs text-gray-500 font-mono">
                    {r.score}/{r.maxScore}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${BAR_COLOR[grade]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {r.hints.length > 0 && (
                  <ul className="space-y-0.5">
                    {r.hints.map((hint, i) => (
                      <li key={i} className="text-xs text-amber-700 flex gap-1.5">
                        <span className="shrink-0">→</span>
                        {hint}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

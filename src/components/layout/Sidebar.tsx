import type { KpiSummary } from '../../utils/kpiScorer';

const SECTIONS = [
  { id: 'identity', label: 'Identity', required: true },
  { id: 'properties', label: 'Properties', required: true },
  { id: 'themes', label: 'Themes', required: true },
  { id: 'geospatial', label: 'Geospatial Extent', required: false },
  { id: 'temporal', label: 'Temporal Extent', required: false },
  { id: 'contacts', label: 'Contacts', required: true },
  { id: 'datapolicy', label: 'Data Policy', required: true },
  { id: 'links', label: 'Links', required: true },
  { id: 'optional', label: 'Optional Fields', required: false },
  { id: 'preview', label: 'JSON Preview', required: false },
];

const GRADE_COLORS: Record<string, string> = {
  A: 'bg-green-500',
  B: 'bg-lime-500',
  C: 'bg-yellow-500',
  D: 'bg-orange-500',
  E: 'bg-red-400',
  F: 'bg-red-600',
};

interface SidebarProps {
  kpi: KpiSummary | null;
}

export function Sidebar({ kpi }: SidebarProps) {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <aside className="fixed top-14 left-0 bottom-0 w-48 bg-gray-50 border-r border-gray-200 overflow-y-auto flex flex-col z-40">
      {/* KPI Score */}
      <div className="p-3 border-b border-gray-200">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Metadata Quality
        </div>
        {kpi ? (
          <>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-lg ${GRADE_COLORS[kpi.grade] || 'bg-gray-400'}`}
              >
                {kpi.grade}
              </span>
              <div>
                <div className="text-sm font-semibold text-gray-700">{kpi.percentage}%</div>
                <div className="text-xs text-gray-500">
                  {kpi.totalScore}/{kpi.maxScore} pts
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${GRADE_COLORS[kpi.grade] || 'bg-gray-400'}`}
                style={{ width: `${kpi.percentage}%` }}
              />
            </div>
          </>
        ) : (
          <div className="text-xs text-gray-400">Fill in fields to see score</div>
        )}
      </div>

      {/* Section links */}
      <nav className="flex-1 py-2">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 mb-1">
          Sections
        </div>
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => scrollTo(s.id)}
            className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-1 transition-colors"
          >
            {s.label}
            {s.required && <span className="text-red-500 text-xs">*</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
}

import { useState } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import type { FormState } from '../../hooks/useWcmp2Form';
import type { Theme } from '../../types/wcmp2';
import { EARTH_SYSTEM_DISCIPLINE_SCHEME } from '../../utils/vocabularies';
import { SectionWrapper } from './SectionWrapper';

interface Props {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  disciplines?: { id: string; title: string }[];
}

const EXTRA_SCHEMES = [
  {
    url: 'http://codes.wmo.int/grib2/codeflag/4.2',
    label: 'GRIB2 Parameters',
  },
  {
    url: 'http://codes.wmo.int/bufr4/b',
    label: 'BUFR4 Elements',
  },
  {
    url: 'https://vocab.nerc.ac.uk/collection/P07/current',
    label: 'CF Standard Names',
  },
];

export function ThemesSection({ form, update, disciplines = [] }: Props) {
  const [search, setSearch] = useState('');
  const [customScheme, setCustomScheme] = useState('');
  const [customConceptId, setCustomConceptId] = useState('');
  const [customConceptTitle, setCustomConceptTitle] = useState('');

  const filtered = disciplines.filter(
    d =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.id.toLowerCase().includes(search.toLowerCase())
  );

  // Find or create the earth-system-discipline theme
  const esdThemeIndex = form.themes.findIndex(t => t.scheme === EARTH_SYSTEM_DISCIPLINE_SCHEME);
  const esdTheme: Theme =
    esdThemeIndex >= 0
      ? form.themes[esdThemeIndex]
      : { scheme: EARTH_SYSTEM_DISCIPLINE_SCHEME, concepts: [] };

  const toggleDiscipline = (id: string, title: string) => {
    const exists = esdTheme.concepts.some(c => c.id === id);
    const newConcepts = exists
      ? esdTheme.concepts.filter(c => c.id !== id)
      : [...esdTheme.concepts, { id, title, url: `${EARTH_SYSTEM_DISCIPLINE_SCHEME}/${id}` }];

    const newTheme = { ...esdTheme, concepts: newConcepts };
    const newThemes = [...form.themes];
    if (esdThemeIndex >= 0) {
      if (newConcepts.length === 0) {
        newThemes.splice(esdThemeIndex, 1);
      } else {
        newThemes[esdThemeIndex] = newTheme;
      }
    } else if (newConcepts.length > 0) {
      newThemes.push(newTheme);
    }
    update('themes', newThemes);
  };

  const addCustomConcept = () => {
    if (!customScheme || !customConceptId) return;
    const existingIdx = form.themes.findIndex(t => t.scheme === customScheme);
    const newConcept = {
      id: customConceptId,
      title: customConceptTitle || undefined,
      url: `${customScheme}/${customConceptId}`,
    };
    const newThemes = [...form.themes];
    if (existingIdx >= 0) {
      newThemes[existingIdx] = {
        ...newThemes[existingIdx],
        concepts: [...newThemes[existingIdx].concepts, newConcept],
      };
    } else {
      newThemes.push({ scheme: customScheme, concepts: [newConcept] });
    }
    update('themes', newThemes);
    setCustomConceptId('');
    setCustomConceptTitle('');
  };

  const removeTheme = (schemeUrl: string) => {
    update('themes', form.themes.filter(t => t.scheme !== schemeUrl));
  };

  const removeConcept = (schemeUrl: string, conceptId: string) => {
    const newThemes = form.themes
      .map(t =>
        t.scheme === schemeUrl
          ? { ...t, concepts: t.concepts.filter(c => c.id !== conceptId) }
          : t
      )
      .filter(t => t.concepts.length > 0);
    update('themes', newThemes);
  };

  return (
    <SectionWrapper id="themes" title="Themes" required>
      <p className="text-sm text-gray-500 mb-4">
        At least one theme using the{' '}
        <strong>Earth System Discipline</strong> vocabulary is required.
      </p>

      {/* Earth System Discipline picker */}
      <div className="mb-5">
        <div className="text-sm font-medium text-gray-700 mb-2">
          Earth System Discipline{' '}
          <span className="text-red-500">*</span>
          <a
            href={EARTH_SYSTEM_DISCIPLINE_SCHEME}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-600 hover:underline ml-2"
          >
            View registry ↗
          </a>
        </div>

        {disciplines.length > 8 && (
          <div className="relative mb-2">
            <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter disciplines…"
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {filtered.map(d => {
            const selected = esdTheme.concepts.some(c => c.id === d.id);
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => toggleDiscipline(d.id, d.title)}
                className={`text-left px-3 py-2 rounded-md border text-sm transition-colors ${
                  selected
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                {d.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Current themes summary */}
      {form.themes.length > 0 && (
        <div className="mb-5 space-y-2">
          <div className="text-sm font-medium text-gray-700">Selected Themes</div>
          {form.themes.map(theme => (
            <div key={theme.scheme} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs text-gray-500 font-mono truncate">{theme.scheme}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {theme.concepts.map(c => (
                      <span
                        key={c.id}
                        className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full"
                      >
                        {c.title || c.id}
                        <button
                          type="button"
                          onClick={() => removeConcept(theme.scheme, c.id)}
                          className="text-blue-500 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeTheme(theme.scheme)}
                  className="text-red-400 hover:text-red-600 shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add concept from other schemes */}
      <details className="mt-2">
        <summary className="cursor-pointer text-sm text-blue-600 hover:underline select-none">
          Add concept from another vocabulary scheme
        </summary>
        <div className="mt-3 space-y-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-600">Scheme URL</label>
              {/^https?:\/\/.+/.test(customScheme) && (
                <a
                  href={customScheme}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  View vocabulary ↗
                </a>
              )}
            </div>
            <div className="flex gap-2 mb-1">
              {EXTRA_SCHEMES.map(s => (
                <button
                  key={s.url}
                  type="button"
                  onClick={() => setCustomScheme(s.url)}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${
                    customScheme === s.url
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={customScheme}
              onChange={e => setCustomScheme(e.target.value)}
              placeholder="https://codes.wmo.int/…"
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Concept ID</label>
              <input
                type="text"
                value={customConceptId}
                onChange={e => setCustomConceptId(e.target.value)}
                placeholder="e.g. 0-2-1"
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Concept Title (optional)</label>
              <input
                type="text"
                value={customConceptTitle}
                onChange={e => setCustomConceptTitle(e.target.value)}
                placeholder="Human-readable label"
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={addCustomConcept}
            disabled={!customScheme || !customConceptId}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-40"
          >
            <Plus size={14} /> Add concept
          </button>
        </div>
      </details>
    </SectionWrapper>
  );
}

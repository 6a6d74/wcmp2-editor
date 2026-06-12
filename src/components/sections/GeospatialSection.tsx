import { lazy, Suspense, useState } from 'react';
import type { FormState } from '../../hooks/useWcmp2Form';
import { SectionWrapper } from './SectionWrapper';
import { CountryPicker } from '../CountryPicker';
import { getCountryBbox, bboxToPolygon, findCountry } from '../../utils/countries';

const LeafletMapWidget = lazy(() =>
  import('../map/LeafletMapWidget').then(m => ({ default: m.LeafletMapWidget }))
);

type GeomMode = 'draw' | 'null' | 'country';

interface Props {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}

export function GeospatialSection({ form, update }: Props) {
  const [mode, setMode] = useState<GeomMode>(form.geometry === null ? 'null' : 'draw');
  const [countryCode, setCountryCode] = useState('');

  const switchMode = (next: GeomMode) => {
    setMode(next);
    if (next === 'null') {
      update('geometry', null);
    } else if (next === 'draw') {
      if (form.geometry === null) {
        update('geometry', { type: 'Polygon', coordinates: [[[]]] } as unknown as GeoJSON.Geometry);
      }
    }
    // 'country' — geometry updated when a country is selected
  };

  const selectCountry = (alpha3: string) => {
    setCountryCode(alpha3);
    const bbox = getCountryBbox(alpha3);
    if (bbox) update('geometry', bboxToPolygon(bbox));
  };

  const selectedCountry = countryCode ? findCountry(countryCode) : undefined;

  const MODES: { id: GeomMode; label: string }[] = [
    { id: 'draw', label: 'Draw on map' },
    { id: 'null', label: 'No geometry (null)' },
    { id: 'country', label: 'Country (bounding box)' },
  ];

  return (
    <SectionWrapper id="geospatial" title="Geospatial Extent">
      <p className="text-sm text-gray-500 mb-3">
        Draw the spatial coverage on the map, pick a country bounding box, or set to null for non-spatial datasets.
      </p>

      {/* Mode selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {MODES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => switchMode(id)}
            className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
              mode === id
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Country picker — shown only in country mode */}
      {mode === 'country' && (
        <div className="mb-4 space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Select country</label>
          <CountryPicker
            value={countryCode}
            onChange={selectCountry}
            className="max-w-xs"
          />
          {selectedCountry && (
            <p className="text-xs text-gray-500">
              Bounding box for <strong>{selectedCountry.name}</strong> set as geometry.
            </p>
          )}
        </div>
      )}

      {/* Map — always visible */}
      <Suspense
        fallback={
          <div className="w-full rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center" style={{ height: 360 }}>
            <span className="text-gray-400 text-sm">Loading map…</span>
          </div>
        }
      >
        <LeafletMapWidget
          geometry={form.geometry}
          onChange={g => update('geometry', g)}
        />
      </Suspense>

      {/* Global bbox shortcut */}
      {mode === 'draw' && form.geometry === null && (
        <button
          type="button"
          onClick={() =>
            update('geometry', {
              type: 'Polygon',
              coordinates: [[[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]]],
            } as GeoJSON.Geometry)
          }
          className="mt-2 text-xs text-blue-600 hover:underline"
        >
          Set to global bounding box (-180, -90, 180, 90)
        </button>
      )}
    </SectionWrapper>
  );
}

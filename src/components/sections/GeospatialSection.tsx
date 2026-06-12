import { lazy, Suspense, useState, useEffect, useRef } from 'react';
import type { FormState } from '../../hooks/useWcmp2Form';
import { SectionWrapper } from './SectionWrapper';
import { CountryPicker } from '../CountryPicker';
import { getCountryBbox, bboxToGeometry, findCountry, type BBox4 } from '../../utils/countries';

const LeafletMapWidget = lazy(() =>
  import('../map/LeafletMapWidget').then(m => ({ default: m.LeafletMapWidget }))
);

type GeomMode = 'draw' | 'null' | 'country' | 'manual';

interface ManualBbox { n: string; e: string; s: string; w: string }

interface Props {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}

function parseManual(b: ManualBbox): BBox4 | null {
  const n = parseFloat(b.n), e = parseFloat(b.e);
  const s = parseFloat(b.s), w = parseFloat(b.w);
  if ([n, e, s, w].some(isNaN)) return null;
  if (n < -90 || n > 90 || s < -90 || s > 90) return null;
  if (e < -180 || e > 180 || w < -180 || w > 180) return null;
  if (s > n) return null;
  return [w, s, e, n];
}

function allCoords(geometry: GeoJSON.Geometry): GeoJSON.Position[] {
  switch (geometry.type) {
    case 'Point':           return [geometry.coordinates];
    case 'MultiPoint':
    case 'LineString':      return geometry.coordinates;
    case 'MultiLineString':
    case 'Polygon':         return geometry.coordinates.flat();
    case 'MultiPolygon':    return geometry.coordinates.flat(2);
    case 'GeometryCollection': return geometry.geometries.flatMap(allCoords);
    default:                return [];
  }
}

function geometryToFields(geometry: GeoJSON.Geometry): ManualBbox | null {
  const coords = allCoords(geometry);
  if (coords.length === 0) return null;
  const lons = coords.map(c => c[0]);
  const lats = coords.map(c => c[1]);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  let minLon = Math.min(...lons), maxLon = Math.max(...lons);

  // Antimeridian-crossing MultiPolygon: split at exactly ±180.
  // Reconstruct true W (min of eastern-hemisphere lons) and E (max of western-hemisphere lons).
  if (maxLon >= 180 && minLon <= -180) {
    const inner = lons.filter(l => l !== 180 && l !== -180);
    const pos = inner.filter(l => l >= 0);
    const neg = inner.filter(l => l < 0);
    if (pos.length > 0 && neg.length > 0) {
      minLon = Math.min(...pos);
      maxLon = Math.max(...neg);
    }
  }

  const fmt = (v: number) => parseFloat(v.toFixed(6)).toString();
  return { n: fmt(maxLat), e: fmt(maxLon), s: fmt(minLat), w: fmt(minLon) };
}

export function GeospatialSection({ form, update }: Props) {
  const [mode, setMode] = useState<GeomMode>(form.geometry === null ? 'null' : 'draw');
  const [countryCode, setCountryCode] = useState('');
  const [manual, setManual] = useState<ManualBbox>({ n: '', e: '', s: '', w: '' });
  const internalRef = useRef(false);

  // Sync mode when geometry changes externally (e.g. record import)
  useEffect(() => {
    if (internalRef.current) {
      internalRef.current = false;
      return;
    }
    setMode(form.geometry === null ? 'null' : 'draw');
    setCountryCode('');
    setManual({ n: '', e: '', s: '', w: '' });
  }, [form.geometry]);

  const switchMode = (next: GeomMode) => {
    setMode(next);
    if (next === 'null') {
      internalRef.current = true;
      update('geometry', null);
    } else if (next === 'draw' && form.geometry === null) {
      internalRef.current = true;
      update('geometry', { type: 'Polygon', coordinates: [[[]]] } as unknown as GeoJSON.Geometry);
    } else if (next === 'manual' && form.geometry) {
      const fields = geometryToFields(form.geometry);
      if (fields) setManual(fields);
    }
    // 'country' — geometry updated when user makes a selection
  };

  const selectCountry = (alpha3: string) => {
    setCountryCode(alpha3);
    const bbox = getCountryBbox(alpha3);
    if (bbox) {
      internalRef.current = true;
      update('geometry', bboxToGeometry(bbox));
    }
  };

  const applyManual = () => {
    const bbox = parseManual(manual);
    if (!bbox) return;
    internalRef.current = true;
    update('geometry', bboxToGeometry(bbox));
  };

  const setField = (field: keyof ManualBbox, value: string) =>
    setManual(prev => ({ ...prev, [field]: value }));

  const manualValid = parseManual(manual) !== null;
  const selectedCountry = countryCode ? findCountry(countryCode) : undefined;

  const MODES: { id: GeomMode; label: string }[] = [
    { id: 'draw',    label: 'Draw on map' },
    { id: 'null',    label: 'No geometry (null)' },
    { id: 'country', label: 'Country (bounding box)' },
    { id: 'manual',  label: 'Enter coordinates' },
  ];

  return (
    <SectionWrapper id="geospatial" title="Geospatial Extent">
      <p className="text-sm text-gray-500 mb-3">
        Draw the spatial coverage on the map, pick a country bounding box, enter coordinates manually, or set to null for non-spatial datasets.
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

      {/* Country picker */}
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

      {/* Manual coordinate entry */}
      {mode === 'manual' && (
        <div className="mb-4 space-y-3">
          <div className="grid grid-cols-3 gap-2 max-w-xs">
            {/* North — centred in top column */}
            <div />
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1 text-center">N °</label>
              <input
                type="number" min={-90} max={90} step="any"
                value={manual.n}
                onChange={e => setField('n', e.target.value)}
                placeholder="e.g. 71.5"
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div />

            {/* West | (gap) | East */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1 text-center">W °</label>
              <input
                type="number" min={-180} max={180} step="any"
                value={manual.w}
                onChange={e => setField('w', e.target.value)}
                placeholder="e.g. -14.0"
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center justify-center">
              <span className="text-xs text-gray-400 select-none">↔</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1 text-center">E °</label>
              <input
                type="number" min={-180} max={180} step="any"
                value={manual.e}
                onChange={e => setField('e', e.target.value)}
                placeholder="e.g. 40.0"
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* South — centred in bottom column */}
            <div />
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1 text-center">S °</label>
              <input
                type="number" min={-90} max={90} step="any"
                value={manual.s}
                onChange={e => setField('s', e.target.value)}
                placeholder="e.g. 49.9"
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div />
          </div>

          <p className="text-xs text-gray-400">
            Decimal degrees, WGS84. If W &gt; E the bounding box is treated as crossing the antimeridian.
          </p>

          <button
            type="button"
            onClick={applyManual}
            disabled={!manualValid}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Apply
          </button>
        </div>
      )}

      {/* Map — hidden only when geometry is null */}
      {mode !== 'null' ? (
        <Suspense
          fallback={
            <div className="w-full rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center" style={{ height: 360 }}>
              <span className="text-gray-400 text-sm">Loading map…</span>
            </div>
          }
        >
          <LeafletMapWidget
            geometry={form.geometry}
            onChange={g => { internalRef.current = true; update('geometry', g); }}
          />
        </Suspense>
      ) : (
        <div
          className="w-full rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center"
          style={{ height: 120 }}
        >
          <span className="text-gray-400 text-sm">Geometry set to null — non-spatial or global</span>
        </div>
      )}

      {/* Global bbox shortcut */}
      {mode === 'draw' && form.geometry === null && (
        <button
          type="button"
          onClick={() => {
            internalRef.current = true;
            update('geometry', {
              type: 'Polygon',
              coordinates: [[[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]]],
            } as GeoJSON.Geometry);
          }}
          className="mt-2 text-xs text-blue-600 hover:underline"
        >
          Set to global bounding box (-180, -90, 180, 90)
        </button>
      )}
    </SectionWrapper>
  );
}

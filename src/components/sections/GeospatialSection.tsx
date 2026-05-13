import { lazy, Suspense } from 'react';
import type { FormState } from '../../hooks/useWcmp2Form';
import { SectionWrapper } from './SectionWrapper';

const LeafletMapWidget = lazy(() =>
  import('../map/LeafletMapWidget').then(m => ({ default: m.LeafletMapWidget }))
);

interface Props {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}

export function GeospatialSection({ form, update }: Props) {
  const isNull = form.geometry === null;

  return (
    <SectionWrapper id="geospatial" title="Geospatial Extent">
      <p className="text-sm text-gray-500 mb-3">
        Draw the spatial coverage on the map. Set to null for non-spatial datasets or global services.
      </p>

      <div className="flex items-center gap-3 mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isNull}
            onChange={e => update('geometry', e.target.checked ? null : null)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600"
          />
          <span className="text-sm text-gray-700">No geometry (null) — non-spatial or global</span>
        </label>
      </div>

      {!isNull || form.geometry ? (
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
      ) : (
        <div
          className="w-full rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
          style={{ height: 200 }}
          onClick={() => update('geometry', null)}
        >
          <span className="text-gray-400 text-sm">Geometry set to null</span>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); update('geometry', { type: 'Polygon', coordinates: [[[]] ] } as unknown as GeoJSON.Geometry); }}
            className="text-blue-600 text-sm hover:underline"
          >
            Click to open map and draw extent
          </button>
        </div>
      )}

      {form.geometry === null && (
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

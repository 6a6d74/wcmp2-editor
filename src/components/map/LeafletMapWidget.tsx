import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import './leaflet-draw-icons.css';
import 'leaflet-draw';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet's broken default marker icon URL detection in bundled environments
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)['_getIconUrl'];
L.Icon.Default.mergeOptions({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIcon2xUrl,
  shadowUrl: markerShadowUrl,
});

interface Props {
  geometry: GeoJSON.Geometry | null;
  onChange: (geometry: GeoJSON.Geometry | null) => void;
}

interface ConfirmDialog {
  message: string;
  onConfirm: () => void;
}

type ShapeType = 'none' | 'points' | 'polygons';

function getCurrentShapeType(drawnItems: L.FeatureGroup): ShapeType {
  const layers = drawnItems.getLayers();
  if (layers.length === 0) return 'none';
  if (layers.some(l => l instanceof L.Marker)) return 'points';
  return 'polygons';
}

function computeGeometry(drawnItems: L.FeatureGroup): GeoJSON.Geometry | null {
  const layers = drawnItems.getLayers();
  if (layers.length === 0) return null;

  const markers = layers.filter(l => l instanceof L.Marker) as L.Marker[];
  const polys   = layers.filter(l => l instanceof L.Polygon) as L.Polygon[];

  if (markers.length > 0) {
    const coords = markers.map(m => {
      const ll = m.getLatLng();
      return [ll.lng, ll.lat] as GeoJSON.Position;
    });
    if (coords.length === 1) return { type: 'Point', coordinates: coords[0] };
    return { type: 'MultiPoint', coordinates: coords };
  }

  if (polys.length > 0) {
    type PolyFeature = { geometry: GeoJSON.Polygon };
    const allCoords = polys.map(
      p => ((p as unknown as { toGeoJSON: () => PolyFeature }).toGeoJSON()).geometry.coordinates
    );
    if (allCoords.length === 1) return { type: 'Polygon', coordinates: allCoords[0] };
    return { type: 'MultiPolygon', coordinates: allCoords };
  }

  return null;
}

function geometryLabel(geometry: GeoJSON.Geometry): string {
  switch (geometry.type) {
    case 'Point':
      return `Point [${(geometry as GeoJSON.Point).coordinates.map(n => n.toFixed(4)).join(', ')}]`;
    case 'MultiPoint':
      return `MultiPoint [${(geometry as GeoJSON.MultiPoint).coordinates.length} points]`;
    case 'Polygon':
      return `Polygon [${(geometry as GeoJSON.Polygon).coordinates[0].length - 1} vertices]`;
    case 'MultiPolygon':
      return `MultiPolygon [${(geometry as GeoJSON.MultiPolygon).coordinates.length} polygons]`;
    default:
      return geometry.type;
  }
}

export function LeafletMapWidget({ geometry, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const drawnLayerRef = useRef<L.FeatureGroup | null>(null);
  // Keep onChange in a ref so stale-closure event handlers always call the latest version
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  // Set to true when the user draws/edits on the map so the sync effect skips fitBounds
  const internalDrawRef = useRef(false);

  // React dialog for geometry-type conflict — avoids window.confirm scroll-to-top side-effect
  const [dialog, setDialog] = useState<ConfirmDialog | null>(null);
  // Stable ref so Leaflet event handlers (set up once) can open the dialog
  const showDialogRef = useRef<(msg: string, onConfirm: () => void) => void>(() => {});
  showDialogRef.current = (message, onConfirm) => setDialog({ message, onConfirm });

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { center: [20, 0], zoom: 2, attributionControl: true });
    map.attributionControl.setPrefix('');
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnLayerRef.current = drawnItems;

    const drawControl = new (L.Control as unknown as { Draw: new (opts: unknown) => L.Control }).Draw({
      position: 'topright',
      draw: {
        rectangle: false,
        polygon: { shapeOptions: { color: '#2563eb', weight: 2 } },
        polyline: false,
        circle: false,
        circlemarker: false,
        marker: true,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    });
    map.addControl(drawControl);

    // Internal access to draw handlers for programmatic (re-)activation after conflict dialog
    type DrawModeMap = Record<string, { handler: { enable: () => void } }>;
    const drawModes: DrawModeMap =
      (drawControl as unknown as { _toolbars: { draw: { _modes: DrawModeMap } } })
        ._toolbars.draw._modes;

    // Show the React conflict dialog instead of window.confirm so page scroll is preserved
    function askTypeSwitch(
      current: ShapeType,
      incoming: ShapeType,
      onConfirmed: () => void
    ) {
      const existingLabel = current === 'points' ? 'point' : 'polygon';
      const incomingLabel = incoming === 'points' ? 'point' : 'polygon';
      showDialogRef.current(
        `You already have ${existingLabel} geometry on the map. ` +
        `Switching to ${incomingLabel} geometry will delete it. Proceed?`,
        () => {
          // End any active edit or delete session before clearing
          const editToolbar = (drawControl as unknown as { _toolbars: { edit: { _modes: Record<string, { handler: { enabled: () => boolean; disable: () => void } }> } } })._toolbars?.edit;
          if (editToolbar) {
            ['edit', 'remove'].forEach(m => {
              const handler = editToolbar._modes?.[m]?.handler;
              if (handler?.enabled()) handler.disable();
            });
          }
          drawnItems.clearLayers();
          onConfirmed();
        }
      );
    }

    // --- Click-click bounding box tool ---
    let bboxActive = false;
    let firstPoint: L.LatLng | null = null;
    let preview: L.Rectangle | null = null;
    let bboxBtnEl: HTMLElement | null = null;

    function activateBbox() {
      bboxActive = true; firstPoint = null;
      map.getContainer().style.cursor = 'crosshair';
      bboxBtnEl?.classList.add('bbox-active');
    }
    function deactivateBbox() {
      bboxActive = false; firstPoint = null;
      if (preview) { map.removeLayer(preview); preview = null; }
      map.getContainer().style.cursor = '';
      bboxBtnEl?.classList.remove('bbox-active');
    }

    // Insert bbox button into the draw toolbar immediately after the polygon button
    const drawToolbar = map.getContainer().querySelector<HTMLElement>(
      '.leaflet-draw-section .leaflet-draw-toolbar'
    );
    const polygonBtn = drawToolbar?.querySelector<HTMLElement>('.leaflet-draw-draw-polygon');

    if (drawToolbar && polygonBtn) {
      const a = document.createElement('a');
      a.href = '#';
      a.className = 'leaflet-draw-draw-bbox';
      a.title = 'Draw bounding box (click to set first corner, click again to complete)';
      bboxBtnEl = a;
      drawToolbar.insertBefore(a, polygonBtn.nextSibling);
      L.DomEvent.on(a, 'click', L.DomEvent.stop);
      L.DomEvent.on(a, 'click', () => {
        if (bboxActive) { deactivateBbox(); return; }
        const current = getCurrentShapeType(drawnItems);
        if (current === 'points') {
          askTypeSwitch('points', 'polygons', activateBbox);
        } else {
          activateBbox();
        }
      });
    }

    // Capture-phase listeners fire before Leaflet Draw's bubble-phase handlers,
    // allowing us to intercept and optionally block the tool activation.
    polygonBtn?.addEventListener('click', (e) => {
      if (getCurrentShapeType(drawnItems) === 'points') {
        e.stopImmediatePropagation();
        e.preventDefault();
        askTypeSwitch('points', 'polygons', () => drawModes['polygon']?.handler.enable());
      }
    }, { capture: true });

    const markerBtn = drawToolbar?.querySelector<HTMLElement>('.leaflet-draw-draw-marker');
    markerBtn?.addEventListener('click', (e) => {
      if (getCurrentShapeType(drawnItems) === 'polygons') {
        e.stopImmediatePropagation();
        e.preventDefault();
        askTypeSwitch('polygons', 'points', () => drawModes['marker']?.handler.enable());
      }
    }, { capture: true });
    // ------------------------------------

    map.on('click', (e: L.LeafletMouseEvent) => {
      if (!bboxActive) return;
      if (!firstPoint) {
        firstPoint = e.latlng;
        preview = L.rectangle(L.latLngBounds(firstPoint, firstPoint), {
          color: '#2563eb', weight: 2, fillOpacity: 0.1, dashArray: '6 4',
        }).addTo(map);
      } else {
        const bounds = L.latLngBounds(firstPoint, e.latlng);
        if (preview) { map.removeLayer(preview); preview = null; }
        drawnItems.addLayer(L.rectangle(bounds, { color: '#2563eb', weight: 2 }));
        internalDrawRef.current = true;
        onChangeRef.current(computeGeometry(drawnItems));
        deactivateBbox();
      }
    });

    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      if (!bboxActive || !firstPoint || !preview) return;
      preview.setBounds(L.latLngBounds(firstPoint, e.latlng));
    });

    // Deactivate bbox when a leaflet-draw tool is activated
    map.on(L.Draw.Event.DRAWSTART, () => { if (bboxActive) deactivateBbox(); });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && bboxActive) deactivateBbox();
    };
    document.addEventListener('keydown', onKeyDown);

    // Accumulate new shapes rather than replacing — supports multi-geometries
    map.on(L.Draw.Event.CREATED, (e: unknown) => {
      const event = e as { layer: L.Layer };
      drawnItems.addLayer(event.layer);
      internalDrawRef.current = true;
      onChangeRef.current(computeGeometry(drawnItems));
    });

    // After individual shapes are deleted, recompute from what remains
    map.on(L.Draw.Event.DELETED, () => {
      internalDrawRef.current = true;
      onChangeRef.current(computeGeometry(drawnItems));
    });

    // Layers are mutated in place during edit; recompute from current state
    map.on(L.Draw.Event.EDITED, () => {
      internalDrawRef.current = true;
      onChangeRef.current(computeGeometry(drawnItems));
    });

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync externally-provided geometry onto the map (e.g. import / country picker / JSON mode).
  // Point and MultiPoint use L.Marker so they are draggable in edit mode.
  useEffect(() => {
    const map = mapRef.current;
    const drawnItems = drawnLayerRef.current;
    if (!map || !drawnItems) return;

    if (internalDrawRef.current) {
      internalDrawRef.current = false;
      return;
    }

    drawnItems.clearLayers();
    if (geometry) {
      try {
        if (geometry.type === 'Point') {
          const [lng, lat] = (geometry as GeoJSON.Point).coordinates;
          drawnItems.addLayer(L.marker([lat, lng]));
        } else if (geometry.type === 'MultiPoint') {
          (geometry as GeoJSON.MultiPoint).coordinates.forEach(([lng, lat]) => {
            drawnItems.addLayer(L.marker([lat, lng]));
          });
        } else {
          const layer = L.geoJSON(geometry as Parameters<typeof L.geoJSON>[0]);
          layer.eachLayer(l => drawnItems.addLayer(l));
        }
        const bounds = drawnItems.getBounds();
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
      } catch {
        // invalid geometry — ignore
      }
    }
  }, [geometry]);

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="w-full rounded-lg border border-gray-300 overflow-hidden"
        style={{ height: 360, isolation: 'isolate' }}
      />

      {/* Geometry-type conflict dialog — rendered as a React overlay to avoid
          the scroll-to-top side-effect that window.confirm causes */}
      {dialog && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4">
            <p className="text-sm text-gray-700">{dialog.message}</p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDialog(null)}
                className="px-4 py-2 rounded text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => { dialog.onConfirm(); setDialog(null); }}
                className="px-4 py-2 rounded text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {geometry ? (
        <div className="flex items-center justify-between">
          <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 truncate max-w-sm">
            {geometryLabel(geometry)}
          </code>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-red-600 hover:underline"
          >
            Clear geometry
          </button>
        </div>
      ) : (
        <p className="text-xs text-gray-500">
          Use the drawing tools on the map to define the spatial extent, or leave null for non-spatial datasets.
        </p>
      )}
    </div>
  );
}

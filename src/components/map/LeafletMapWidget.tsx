import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import './leaflet-draw-icons.css';

// Leaflet-draw needs to be imported after leaflet
import 'leaflet-draw';

interface Props {
  geometry: GeoJSON.Geometry | null;
  onChange: (geometry: GeoJSON.Geometry | null) => void;
}

export function LeafletMapWidget({ geometry, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const drawnLayerRef = useRef<L.FeatureGroup | null>(null);
  // Keep onChange in a ref so stale-closure event handlers always call the latest version
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [20, 0],
      zoom: 2,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnLayerRef.current = drawnItems;

    // rectangle: false — replaced by the custom click-click bbox tool below
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

    // --- Click-click bounding box tool ---
    let bboxActive = false;
    let firstPoint: L.LatLng | null = null;
    let preview: L.Rectangle | null = null;
    let bboxBtnEl: HTMLElement | null = null;

    function activateBbox() {
      bboxActive = true;
      firstPoint = null;
      map.getContainer().style.cursor = 'crosshair';
      bboxBtnEl?.classList.add('bbox-active');
    }

    function deactivateBbox() {
      bboxActive = false;
      firstPoint = null;
      if (preview) { map.removeLayer(preview); preview = null; }
      map.getContainer().style.cursor = '';
      bboxBtnEl?.classList.remove('bbox-active');
    }

    const BBoxControl = L.Control.extend({
      onAdd() {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const a = L.DomUtil.create('a', '', container) as HTMLAnchorElement;
        a.href = '#';
        a.title = 'Draw bounding box (click to set first corner, click again to complete)';
        a.style.cssText = 'display:flex;align-items:center;justify-content:center;width:26px;height:26px;font-size:15px;';
        a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="3" cy="3" r="1.5" fill="currentColor" stroke="none"/><circle cx="21" cy="21" r="1.5" fill="currentColor" stroke="none"/></svg>`;
        bboxBtnEl = a;

        L.DomEvent.on(a, 'click', L.DomEvent.stop);
        L.DomEvent.on(a, 'click', () => {
          if (bboxActive) deactivateBbox();
          else activateBbox();
        });

        return container;
      },
    });

    map.addControl(new BBoxControl({ position: 'topright' }));

    map.on('click', (e: L.LeafletMouseEvent) => {
      if (!bboxActive) return;
      if (!firstPoint) {
        firstPoint = e.latlng;
        preview = L.rectangle(L.latLngBounds(firstPoint, firstPoint), {
          color: '#2563eb',
          weight: 2,
          fillOpacity: 0.1,
          dashArray: '6 4',
        }).addTo(map);
      } else {
        const bounds = L.latLngBounds(firstPoint, e.latlng);
        if (preview) { map.removeLayer(preview); preview = null; }
        drawnItems.clearLayers();
        const rect = L.rectangle(bounds, { color: '#2563eb', weight: 2 });
        drawnItems.addLayer(rect);
        onChangeRef.current(rect.toGeoJSON().geometry);
        deactivateBbox();
      }
    });

    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      if (!bboxActive || !firstPoint || !preview) return;
      preview.setBounds(L.latLngBounds(firstPoint, e.latlng));
    });

    // Escape cancels an in-progress bbox draw
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && bboxActive) deactivateBbox();
    };
    document.addEventListener('keydown', onKeyDown);
    // ------------------------------------

    map.on(L.Draw.Event.CREATED, (e: unknown) => {
      const event = e as { layer: L.Layer };
      drawnItems.clearLayers();
      drawnItems.addLayer(event.layer);
      const geojson = (event.layer as L.GeoJSON).toGeoJSON() as unknown as {
        geometry: GeoJSON.Geometry;
      };
      onChangeRef.current(geojson.geometry);
    });

    map.on(L.Draw.Event.DELETED, () => {
      if (drawnItems.getLayers().length === 0) onChangeRef.current(null);
    });

    map.on(L.Draw.Event.EDITED, () => {
      const layers = drawnItems.getLayers();
      if (layers.length > 0) {
        const geojson = (layers[0] as L.GeoJSON).toGeoJSON() as unknown as {
          geometry: GeoJSON.Geometry;
        };
        onChangeRef.current(geojson.geometry);
      }
    });

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync external geometry changes onto the map
  useEffect(() => {
    const map = mapRef.current;
    const drawnItems = drawnLayerRef.current;
    if (!map || !drawnItems) return;

    drawnItems.clearLayers();
    if (geometry) {
      try {
        const layer = L.geoJSON(geometry as Parameters<typeof L.geoJSON>[0]);
        layer.eachLayer(l => drawnItems.addLayer(l));
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
      {geometry ? (
        <div className="flex items-center justify-between">
          <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 truncate max-w-sm">
            {geometry.type}
            {geometry.type === 'Polygon' &&
              ` [${(geometry as GeoJSON.Polygon).coordinates[0].length - 1} vertices]`}
            {geometry.type === 'Point' &&
              ` [${(geometry as GeoJSON.Point).coordinates.map(n => n.toFixed(4)).join(', ')}]`}
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

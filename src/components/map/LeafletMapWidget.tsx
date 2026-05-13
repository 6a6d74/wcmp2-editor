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

    const drawControl = new (L.Control as unknown as { Draw: new (opts: unknown) => L.Control }).Draw({
      position: 'topright',
      draw: {
        rectangle: { shapeOptions: { color: '#2563eb', weight: 2 } },
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

    map.on(L.Draw.Event.CREATED, (e: unknown) => {
      const event = e as { layer: L.Layer };
      drawnItems.clearLayers();
      drawnItems.addLayer(event.layer);
      const geojson = (event.layer as L.GeoJSON).toGeoJSON() as unknown as {
        geometry: GeoJSON.Geometry;
      };
      onChange(geojson.geometry);
    });

    map.on(L.Draw.Event.DELETED, () => {
      if (drawnItems.getLayers().length === 0) onChange(null);
    });

    map.on(L.Draw.Event.EDITED, () => {
      const layers = drawnItems.getLayers();
      if (layers.length > 0) {
        const geojson = (layers[0] as L.GeoJSON).toGeoJSON() as unknown as {
          geometry: GeoJSON.Geometry;
        };
        onChange(geojson.geometry);
      }
    });

    return () => {
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

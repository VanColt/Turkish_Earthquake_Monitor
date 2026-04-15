'use client';

import { useEffect, useRef } from 'react';
import maplibregl, {
  Map as MapLibreMap,
  LngLatBoundsLike,
  StyleSpecification,
} from 'maplibre-gl';
import type { Earthquake } from '@/services/earthquakeService';

interface GlobeProps {
  earthquakes: Earthquake[];
  selected: Earthquake | null;
  onSelect: (eq: Earthquake) => void;
}

// Tight bounding box around Türkiye — used for the landing view.
const TURKEY_BOUNDS: LngLatBoundsLike = [
  [25.5, 35.7],
  [45.1, 42.3],
];

const DARK_STYLE: StyleSpecification = {
  version: 8,
  projection: { type: 'globe' },
  sources: {
    basemap: {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap · © CARTO',
    },
    labels: {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
    },
  },
  sky: {
    'atmosphere-blend': [
      'interpolate',
      ['linear'],
      ['zoom'],
      0, 0.8,
      5, 0.4,
      8, 0,
    ],
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#05050a' } },
    {
      id: 'basemap',
      type: 'raster',
      source: 'basemap',
      paint: { 'raster-opacity': 0.9, 'raster-saturation': -0.25 },
    },
    {
      id: 'labels',
      type: 'raster',
      source: 'labels',
      paint: { 'raster-opacity': 0.85 },
    },
  ],
};

function toGeoJSON(earthquakes: Earthquake[], latestId: string | null) {
  return {
    type: 'FeatureCollection' as const,
    features: earthquakes.map((e) => ({
      type: 'Feature' as const,
      geometry: e.geojson as GeoJSON.Point,
      properties: {
        id: e.earthquake_id,
        mag: e.mag,
        depth: e.depth,
        title: e.title,
        date_time: e.date_time,
        latest: e.earthquake_id === latestId ? 1 : 0,
      },
    })),
  };
}

export default function Globe({ earthquakes, selected, onSelect }: GlobeProps) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const earthquakesRef = useRef<Earthquake[]>(earthquakes);

  useEffect(() => {
    earthquakesRef.current = earthquakes;
  }, [earthquakes]);

  // Map initialization — runs once
  useEffect(() => {
    if (!container.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: container.current,
      style: DARK_STYLE,
      // Start already framed on Türkiye so there's no wide globe view.
      bounds: TURKEY_BOUNDS,
      fitBoundsOptions: { padding: 48, animate: false },
      pitch: 0,
      bearing: 0,
      attributionControl: false,
      renderWorldCopies: false,
      dragRotate: false,
      pitchWithRotate: false,
    });
    map.touchZoomRotate.disableRotation();
    mapRef.current = map;

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false, visualizePitch: false }),
      'top-right'
    );

    map.on('error', (e) => {
      console.error('[globe] maplibre error:', e.error ?? e);
    });

    map.on('load', () => {
      // Turkey boundary — subtle fill + amber outline to make TR pop.
      map.addSource('tr-border', {
        type: 'geojson',
        data: '/turkey.geojson',
      });

      map.addLayer(
        {
          id: 'tr-fill',
          type: 'fill',
          source: 'tr-border',
          paint: {
            'fill-color': '#f0c14a',
            'fill-opacity': 0.04,
          },
        },
        'labels'
      );

      // Outer glow (wider, very soft)
      map.addLayer(
        {
          id: 'tr-glow',
          type: 'line',
          source: 'tr-border',
          paint: {
            'line-color': '#f0c14a',
            'line-width': 6,
            'line-opacity': 0.12,
            'line-blur': 4,
          },
        },
        'labels'
      );

      // Crisp inner line
      map.addLayer(
        {
          id: 'tr-line',
          type: 'line',
          source: 'tr-border',
          paint: {
            'line-color': '#f0c14a',
            'line-width': 1.2,
            'line-opacity': 0.75,
          },
        },
        'labels'
      );

      // Earthquake source + layers
      map.addSource('quakes', { type: 'geojson', data: toGeoJSON([], null) });

      map.addLayer({
        id: 'quakes-ring',
        type: 'circle',
        source: 'quakes',
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['get', 'mag'],
            0, 4, 3, 7, 5, 14, 6, 22, 8, 34,
          ],
          'circle-color': 'transparent',
          'circle-stroke-width': ['case', ['==', ['get', 'latest'], 1], 2, 1],
          'circle-stroke-color': [
            'interpolate', ['linear'], ['get', 'mag'],
            0, '#7be3c5', 3, '#f0c14a', 5, '#f28a3d', 6, '#e34848',
          ],
          'circle-stroke-opacity': [
            'interpolate', ['linear'], ['get', 'depth'],
            0, 1, 100, 0.7, 300, 0.4,
          ],
        },
      });

      map.addLayer({
        id: 'quakes-core',
        type: 'circle',
        source: 'quakes',
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['get', 'mag'],
            0, 1.5, 3, 2.5, 5, 4, 6, 6,
          ],
          'circle-color': [
            'interpolate', ['linear'], ['get', 'mag'],
            0, '#7be3c5', 3, '#f0c14a', 5, '#f28a3d', 6, '#e34848',
          ],
        },
      });

      map.addLayer({
        id: 'quakes-pulse',
        type: 'circle',
        source: 'quakes',
        filter: ['==', ['get', 'latest'], 1],
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['get', 'mag'],
            0, 10, 5, 24, 7, 38,
          ],
          'circle-color': 'transparent',
          'circle-stroke-color': '#f0c14a',
          'circle-stroke-width': 1,
          'circle-stroke-opacity': 0.6,
        },
      });

      // Cursor feedback
      map.on('mouseenter', 'quakes-core', () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', 'quakes-core', () => (map.getCanvas().style.cursor = ''));
      map.on('mouseenter', 'quakes-ring', () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', 'quakes-ring', () => (map.getCanvas().style.cursor = ''));

      // Click to select
      const onClick = (
        e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }
      ) => {
        const f = e.features?.[0];
        if (!f) return;
        const id = f.properties?.id;
        const match = earthquakesRef.current.find((q) => q.earthquake_id === id);
        if (match) onSelect(match);
      };
      map.on('click', 'quakes-core', onClick);
      map.on('click', 'quakes-ring', onClick);

      // Ensure we are framed on Turkey precisely after load.
      map.fitBounds(TURKEY_BOUNDS, { padding: 48, duration: 0 });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update source data when earthquakes change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const latest = earthquakes.length
      ? earthquakes.reduce((a, b) =>
          new Date(a.date_time).getTime() > new Date(b.date_time).getTime() ? a : b
        ).earthquake_id
      : null;

    const apply = () => {
      const src = map.getSource('quakes') as maplibregl.GeoJSONSource | undefined;
      if (!src) return;
      src.setData(toGeoJSON(earthquakes, latest));
    };

    if (map.isStyleLoaded()) apply();
    else map.once('load', apply);
  }, [earthquakes]);

  // Fly to selected
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selected) return;
    const [lng, lat] = selected.geojson.coordinates;
    map.flyTo({ center: [lng, lat], zoom: 7.2, duration: 1600, pitch: 25, bearing: 0 });
  }, [selected]);

  return (
    <div
      ref={container}
      className="absolute inset-0"
      style={{ background: 'radial-gradient(ellipse at center, #0a0a12 0%, #03030a 70%)' }}
    />
  );
}

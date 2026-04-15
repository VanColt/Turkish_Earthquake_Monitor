'use client';

import { useEffect, useRef } from 'react';
import maplibregl, { Map as MapLibreMap, StyleSpecification } from 'maplibre-gl';
import type { Earthquake } from '@/services/earthquakeService';

interface GlobeProps {
  earthquakes: Earthquake[];
  selected: Earthquake | null;
  onSelect: (eq: Earthquake) => void;
}

const TURKEY_CENTER: [number, number] = [35.0, 39.0];

// Minimal dark globe style. Raster basemap (CartoDB dark) keeps things
// dependency-free while supporting globe projection in MapLibre v5+.
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
    {
      id: 'bg',
      type: 'background',
      paint: { 'background-color': '#05050a' },
    },
    {
      id: 'basemap',
      type: 'raster',
      source: 'basemap',
      paint: { 'raster-opacity': 0.85, 'raster-saturation': -0.25 },
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
  const spinRef = useRef<number | null>(null);
  const interactingRef = useRef(false);
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
      center: TURKEY_CENTER,
      zoom: 2.2,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
      renderWorldCopies: false,
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }), 'top-right');

    map.on('error', (e) => {
      console.error('[globe] maplibre error:', e.error ?? e);
    });

    map.on('load', () => {
      // Source + layers for earthquakes
      map.addSource('quakes', {
        type: 'geojson',
        data: toGeoJSON([], null),
      });

      // Outer ring — thin hairline
      map.addLayer({
        id: 'quakes-ring',
        type: 'circle',
        source: 'quakes',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'mag'],
            0, 4,
            3, 7,
            5, 14,
            6, 22,
            8, 34,
          ],
          'circle-color': 'transparent',
          'circle-stroke-width': [
            'case',
            ['==', ['get', 'latest'], 1], 2,
            1,
          ],
          'circle-stroke-color': [
            'interpolate',
            ['linear'],
            ['get', 'mag'],
            0, '#7be3c5',
            3, '#f0c14a',
            5, '#f28a3d',
            6, '#e34848',
          ],
          'circle-stroke-opacity': [
            'interpolate',
            ['linear'],
            ['get', 'depth'],
            0, 1,
            100, 0.7,
            300, 0.4,
          ],
        },
      });

      // Solid inner core
      map.addLayer({
        id: 'quakes-core',
        type: 'circle',
        source: 'quakes',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'mag'],
            0, 1.5,
            3, 2.5,
            5, 4,
            6, 6,
          ],
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'mag'],
            0, '#7be3c5',
            3, '#f0c14a',
            5, '#f28a3d',
            6, '#e34848',
          ],
        },
      });

      // Pulse halo on latest event only
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

      // Interactions
      map.on('mouseenter', 'quakes-core', () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', 'quakes-core', () => (map.getCanvas().style.cursor = ''));
      map.on('mouseenter', 'quakes-ring', () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', 'quakes-ring', () => (map.getCanvas().style.cursor = ''));

      const onClick = (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
        const f = e.features?.[0];
        if (!f) return;
        const id = f.properties?.id;
        const match = earthquakesRef.current.find((q) => q.earthquake_id === id);
        if (match) onSelect(match);
      };
      map.on('click', 'quakes-core', onClick);
      map.on('click', 'quakes-ring', onClick);

      // Auto-rotation while idle
      const idleSpin = () => {
        if (interactingRef.current) return;
        const b = map.getBearing();
        map.easeTo({ bearing: b + 0.25, duration: 1000, easing: (t) => t });
      };
      spinRef.current = window.setInterval(idleSpin, 1000);

      // Pause spin on user interaction
      const pause = () => {
        interactingRef.current = true;
      };
      const resume = () => {
        window.setTimeout(() => {
          interactingRef.current = false;
        }, 6000);
      };
      map.on('mousedown', pause);
      map.on('wheel', pause);
      map.on('touchstart', pause);
      map.on('mouseup', resume);
      map.on('touchend', resume);

      // Initial gentle fly-in to Turkey
      setTimeout(() => {
        map.flyTo({ center: TURKEY_CENTER, zoom: 4.2, duration: 2600, pitch: 20 });
      }, 400);
    });

    return () => {
      if (spinRef.current) window.clearInterval(spinRef.current);
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
    interactingRef.current = true;
    map.flyTo({ center: [lng, lat], zoom: 7, duration: 1600, pitch: 35 });
    window.setTimeout(() => {
      interactingRef.current = false;
    }, 8000);
  }, [selected]);

  return (
    <div
      ref={container}
      className="absolute inset-0"
      style={{ background: 'radial-gradient(ellipse at center, #0a0a12 0%, #03030a 70%)' }}
    />
  );
}

'use client';

import { useEffect, useRef } from 'react';
import maplibregl, {
  Map as MapLibreMap,
  LngLatBoundsLike,
  StyleSpecification,
} from 'maplibre-gl';
import type { Earthquake } from '@/services/earthquakeService';
import { Settings, DEFAULT_SETTINGS } from '@/lib/settings';

interface GlobeProps {
  earthquakes: Earthquake[];
  selected: Earthquake | null;
  onSelect: (eq: Earthquake) => void;
  onOpenSettings?: () => void;
  settings?: Settings;
}

// Custom MapLibre control: a single button. We use it for the "view settings"
// button so it stacks visually with the NavigationControl and inherits its
// styling (background, border, hover state from globals.css).
class IconButtonControl implements maplibregl.IControl {
  private container!: HTMLElement;
  private btn!: HTMLButtonElement;

  constructor(
    private readonly opts: { svg: string; title: string; onClick: () => void }
  ) {}

  onAdd(): HTMLElement {
    this.container = document.createElement('div');
    this.container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
    this.btn = document.createElement('button');
    this.btn.type = 'button';
    this.btn.title = this.opts.title;
    this.btn.setAttribute('aria-label', this.opts.title);
    this.btn.innerHTML = this.opts.svg;
    this.btn.addEventListener('click', this.opts.onClick);
    this.container.appendChild(this.btn);
    return this.container;
  }

  setHandler(onClick: () => void) {
    this.opts.onClick = onClick;
  }

  onRemove() {
    this.btn.removeEventListener('click', this.opts.onClick);
    this.container.remove();
  }
}

// Solid filled sliders glyph at 14×14 — same visual weight as the GitHub /
// LinkedIn icons in the top bar.
const SETTINGS_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
    <rect x="2" y="3.5" width="12" height="1.2" rx="0.6" />
    <rect x="2" y="7.4" width="12" height="1.2" rx="0.6" />
    <rect x="2" y="11.3" width="12" height="1.2" rx="0.6" />
    <circle cx="11" cy="4.1" r="2.1" />
    <circle cx="6" cy="8" r="2.1" />
    <circle cx="11" cy="11.9" r="2.1" />
  </svg>
`;

// Tight bounding box around Türkiye — used for the landing view.
const TURKEY_BOUNDS: LngLatBoundsLike = [
  [25.5, 35.7],
  [45.1, 42.3],
];

// OpenFreeMap vector tiles — free, no API key, follows OpenMapTiles schema.
// Gives us per-layer control over water, land, borders, and labels.
const DARK_STYLE: StyleSpecification = {
  version: 8,
  projection: { type: 'globe' },
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources: {
    ofm: {
      type: 'vector',
      url: 'https://tiles.openfreemap.org/planet',
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
    // Land — the base background. Oceans are the darker layer on top.
    {
      id: 'bg',
      type: 'background',
      paint: { 'background-color': '#1a1a24' },
    },

    // Water — oceans, lakes, rivers
    {
      id: 'water',
      type: 'fill',
      source: 'ofm',
      'source-layer': 'water',
      paint: { 'fill-color': '#05050a', 'fill-antialias': true },
    },

    // Subtle landcover — gives the world some texture beneath
    {
      id: 'landcover',
      type: 'fill',
      source: 'ofm',
      'source-layer': 'landcover',
      paint: {
        'fill-color': [
          'match',
          ['get', 'class'],
          'wood', '#1c1d22',
          'grass', '#1d1e22',
          'ice', '#222330',
          'sand', '#252329',
          '#1a1a24',
        ],
        'fill-opacity': 0.45,
      },
    },

    // Urban areas — visible patches over cities
    {
      id: 'landuse-urban',
      type: 'fill',
      source: 'ofm',
      'source-layer': 'landuse',
      filter: ['in', ['get', 'class'], ['literal', ['residential', 'commercial', 'industrial']]],
      minzoom: 5,
      paint: {
        'fill-color': '#2a2a34',
        'fill-opacity': ['interpolate', ['linear'], ['zoom'], 5, 0.3, 9, 0.6],
      },
    },

    // Major highways — thin amber-tinted lines
    {
      id: 'road-major',
      type: 'line',
      source: 'ofm',
      'source-layer': 'transportation',
      filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk']]],
      minzoom: 5,
      paint: {
        'line-color': '#5a4a30',
        'line-width': ['interpolate', ['linear'], ['zoom'], 5, 0.3, 8, 0.8, 12, 1.6],
        'line-opacity': 0.7,
      },
    },

    // Secondary roads
    {
      id: 'road-minor',
      type: 'line',
      source: 'ofm',
      'source-layer': 'transportation',
      filter: ['in', ['get', 'class'], ['literal', ['primary', 'secondary']]],
      minzoom: 7,
      paint: {
        'line-color': '#3a3a44',
        'line-width': ['interpolate', ['linear'], ['zoom'], 7, 0.2, 12, 0.8],
        'line-opacity': 0.6,
      },
    },

    // Country borders
    {
      id: 'boundary-country',
      type: 'line',
      source: 'ofm',
      'source-layer': 'boundary',
      filter: ['all', ['==', ['get', 'admin_level'], 2], ['!=', ['get', 'maritime'], 1]],
      paint: {
        'line-color': '#4a4a58',
        'line-width': ['interpolate', ['linear'], ['zoom'], 2, 0.5, 6, 1.1, 10, 1.6],
        'line-opacity': 0.85,
      },
    },

    // Province / state lines — solid, more legible
    {
      id: 'boundary-state',
      type: 'line',
      source: 'ofm',
      'source-layer': 'boundary',
      filter: ['all', ['==', ['get', 'admin_level'], 4], ['!=', ['get', 'maritime'], 1]],
      minzoom: 4,
      paint: {
        'line-color': '#3a3a44',
        'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.3, 6, 0.6, 10, 1],
        'line-opacity': 0.75,
      },
    },

    // Country labels at low zoom — muted
    {
      id: 'place-country',
      type: 'symbol',
      source: 'ofm',
      'source-layer': 'place',
      filter: ['==', ['get', 'class'], 'country'],
      maxzoom: 6,
      layout: {
        'text-field': ['coalesce', ['get', 'name:latin'], ['get', 'name']],
        'text-font': ['Noto Sans Bold'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 2, 9, 5, 11],
        'text-letter-spacing': 0.12,
        'text-transform': 'uppercase',
        'text-max-width': 7,
      },
      paint: {
        'text-color': '#8a8a9a',
        'text-halo-color': '#0a0a12',
        'text-halo-width': 1.2,
      },
    },

    // Cities outside Turkey — dim
    {
      id: 'place-city-other',
      type: 'symbol',
      source: 'ofm',
      'source-layer': 'place',
      filter: [
        'all',
        ['==', ['get', 'class'], 'city'],
        ['!=', ['get', 'iso_a2'], 'TR'],
      ],
      minzoom: 3,
      layout: {
        'text-field': ['coalesce', ['get', 'name:latin'], ['get', 'name']],
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 3, 10, 8, 13],
        'text-letter-spacing': 0.04,
        'text-max-width': 8,
      },
      paint: {
        'text-color': '#7a7a88',
        'text-halo-color': '#0a0a12',
        'text-halo-width': 1.2,
      },
    },

    // Cities IN Turkey — brighter, weight on these
    {
      id: 'place-city-tr',
      type: 'symbol',
      source: 'ofm',
      'source-layer': 'place',
      filter: [
        'all',
        ['==', ['get', 'class'], 'city'],
        ['==', ['get', 'iso_a2'], 'TR'],
      ],
      minzoom: 3,
      layout: {
        'text-field': ['coalesce', ['get', 'name:latin'], ['get', 'name']],
        'text-font': ['Noto Sans Bold'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 3, 11, 8, 15],
        'text-letter-spacing': 0.04,
        'text-max-width': 8,
      },
      paint: {
        'text-color': '#e6e6ea',
        'text-halo-color': '#05050a',
        'text-halo-width': 1.6,
      },
    },

    // Towns in Turkey — visible at moderate zoom
    {
      id: 'place-town-tr',
      type: 'symbol',
      source: 'ofm',
      'source-layer': 'place',
      filter: [
        'all',
        ['==', ['get', 'class'], 'town'],
        ['==', ['get', 'iso_a2'], 'TR'],
      ],
      minzoom: 5,
      layout: {
        'text-field': ['coalesce', ['get', 'name:latin'], ['get', 'name']],
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 5, 10, 10, 13],
      },
      paint: {
        'text-color': '#b8b8c4',
        'text-halo-color': '#05050a',
        'text-halo-width': 1.4,
      },
    },

    // Towns elsewhere — only at high zoom
    {
      id: 'place-town-other',
      type: 'symbol',
      source: 'ofm',
      'source-layer': 'place',
      filter: [
        'all',
        ['==', ['get', 'class'], 'town'],
        ['!=', ['get', 'iso_a2'], 'TR'],
      ],
      minzoom: 6,
      layout: {
        'text-field': ['coalesce', ['get', 'name:latin'], ['get', 'name']],
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 6, 9, 10, 12],
      },
      paint: {
        'text-color': '#5e5e6c',
        'text-halo-color': '#0a0a12',
        'text-halo-width': 1,
      },
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

export default function Globe({
  earthquakes,
  selected,
  onSelect,
  onOpenSettings,
  settings = DEFAULT_SETTINGS,
}: GlobeProps) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const earthquakesRef = useRef<Earthquake[]>(earthquakes);
  const settingsControlRef = useRef<IconButtonControl | null>(null);
  const settingsHandlerRef = useRef<(() => void) | null>(onOpenSettings ?? null);

  useEffect(() => {
    earthquakesRef.current = earthquakes;
  }, [earthquakes]);

  // Keep the latest settings handler reachable from inside the control.
  useEffect(() => {
    settingsHandlerRef.current = onOpenSettings ?? null;
    settingsControlRef.current?.setHandler(() => settingsHandlerRef.current?.());
  }, [onOpenSettings]);

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
      maxPitch: 0,
    });
    map.touchZoomRotate.disableRotation();
    mapRef.current = map;

    // Bottom-right stack: zoom controls first (closest to corner), then
    // settings button stacked above them.
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false, visualizePitch: false, showZoom: true }),
      'bottom-right'
    );
    const settingsCtrl = new IconButtonControl({
      svg: SETTINGS_SVG,
      title: 'View settings',
      onClick: () => settingsHandlerRef.current?.(),
    });
    settingsControlRef.current = settingsCtrl;
    map.addControl(settingsCtrl, 'bottom-right');

    map.on('error', (e) => {
      console.error('[globe] maplibre error:', e.error ?? e);
    });

    map.on('load', () => {
      // World country polygons — gives us per-country color control.
      // Features use ISO-3 codes as `id` (e.g. "TUR"), `properties.name` is the country name.
      map.addSource('countries', {
        type: 'geojson',
        data: '/countries.geojson',
        generateId: false,
      });

      // Türkiye-only translucent wash. Sits below water so the sea clips
      // it cleanly. White at very low opacity lets the basemap detail
      // (landcover, borders, labels) read through while still lifting TR
      // off the rest of the world.
      map.addLayer(
        {
          id: 'country-fill',
          type: 'fill',
          source: 'countries',
          filter: ['==', ['get', 'name'], 'Turkey'],
          paint: {
            'fill-color': '#ffffff',
            'fill-opacity': 0.025,
          },
        },
        'water'
      );

      // Earthquake source + layers
      map.addSource('quakes', { type: 'geojson', data: toGeoJSON([], null) });

      // Color ramp by magnitude — single source of truth
      const MAG_COLOR: maplibregl.ExpressionSpecification = [
        'interpolate',
        ['linear'],
        ['get', 'mag'],
        0, '#5fd8b8',
        3, '#f5cf5a',
        5, '#f48a3a',
        6, '#e84545',
      ];

      // "Felt-shaking" heatmap.
      // Each event contributes a soft zone whose radius scales with magnitude
      // (proxy for felt-distance) and weight scales with magnitude (so big
      // events still dominate). When zones overlap, MapLibre sums densities,
      // producing brighter regions where activity has clustered.
      map.addLayer({
        id: 'quakes-heat',
        type: 'heatmap',
        source: 'quakes',
        layout: { visibility: 'none' },
        paint: {
          // Curved weight — every event registers, but bigger events are
          // dramatically more influential.
          'heatmap-weight': [
            'interpolate', ['linear'], ['get', 'mag'],
            0, 0.25,
            2, 0.45,
            3, 0.70,
            4, 1.0,
            5, 1.6,
            6, 2.4,
            7, 3.2,
          ],
          // Per-feature radius scaled by magnitude × zoom.
          'heatmap-radius': [
            'interpolate', ['exponential', 2], ['zoom'],
            3, [
              'interpolate', ['linear'], ['get', 'mag'],
              2, 6,
              3, 12,
              4, 22,
              5, 40,
              6, 70,
              7, 130,
            ],
            6, [
              'interpolate', ['linear'], ['get', 'mag'],
              2, 18,
              3, 32,
              4, 60,
              5, 110,
              6, 200,
              7, 380,
            ],
            10, [
              'interpolate', ['linear'], ['get', 'mag'],
              2, 40,
              3, 75,
              4, 140,
              5, 260,
              6, 480,
              7, 920,
            ],
          ],
          'heatmap-intensity': [
            'interpolate', ['linear'], ['zoom'],
            0, 1, 4, 1.4, 8, 2.0, 12, 2.8,
          ],
          // Density → MMI-style color ramp. Visible from the very first
          // bit of density so single events still show up.
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0,    'rgba(0, 0, 0, 0)',
            0.02, 'rgba(95, 216, 184, 0.45)',
            0.15, 'rgba(95, 216, 184, 0.70)',
            0.35, 'rgba(245, 207, 90, 0.80)',
            0.55, 'rgba(244, 138, 58, 0.88)',
            0.80, 'rgba(232, 69, 69, 0.92)',
            1,    'rgba(232, 69, 69, 1)',
          ],
          'heatmap-opacity': 0.95,
        },
      });

      // 1. Outer glow — soft halo so events are spottable from afar
      map.addLayer({
        id: 'quakes-glow',
        type: 'circle',
        source: 'quakes',
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['get', 'mag'],
            0, 14, 3, 20, 5, 32, 6, 46, 8, 64,
          ],
          'circle-color': MAG_COLOR,
          'circle-opacity': 0.12,
          'circle-blur': 0.8,
        },
      });

      // 2. Outer ring — the precision boundary
      map.addLayer({
        id: 'quakes-ring',
        type: 'circle',
        source: 'quakes',
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['get', 'mag'],
            0, 6, 3, 10, 5, 18, 6, 28, 8, 42,
          ],
          'circle-color': 'transparent',
          'circle-stroke-color': MAG_COLOR,
          'circle-stroke-width': ['case', ['==', ['get', 'latest'], 1], 2.2, 1.4],
          'circle-stroke-opacity': [
            'interpolate', ['linear'], ['get', 'depth'],
            0, 1, 100, 0.85, 300, 0.55,
          ],
        },
      });

      // 3. Solid core — clearly readable point
      map.addLayer({
        id: 'quakes-core',
        type: 'circle',
        source: 'quakes',
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['get', 'mag'],
            0, 2.4, 3, 3.6, 5, 5.5, 6, 8,
          ],
          'circle-color': MAG_COLOR,
          'circle-stroke-color': '#0a0a12',
          'circle-stroke-width': 1,
        },
      });

      // 4. White center pinpoint — only visible on M5+, makes big events pop
      map.addLayer({
        id: 'quakes-center',
        type: 'circle',
        source: 'quakes',
        filter: ['>=', ['get', 'mag'], 4.5],
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['get', 'mag'],
            4.5, 1, 6, 2, 8, 3,
          ],
          'circle-color': '#ffffff',
          'circle-opacity': 0.95,
        },
      });

      // 5. Pulse — the LATEST event only, draws the eye to what's new
      map.addLayer({
        id: 'quakes-pulse',
        type: 'circle',
        source: 'quakes',
        filter: ['==', ['get', 'latest'], 1],
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['get', 'mag'],
            0, 18, 5, 36, 7, 56,
          ],
          'circle-color': 'transparent',
          'circle-stroke-color': '#f5cf5a',
          'circle-stroke-width': 1.2,
          'circle-stroke-opacity': 0.7,
        },
      });

      // Cursor + click — bind on the most "outside" hit-target (glow/ring)
      // so users don't have to land on the tiny core.
      const HIT_LAYERS = ['quakes-glow', 'quakes-ring', 'quakes-core'];
      for (const layer of HIT_LAYERS) {
        map.on('mouseenter', layer, () => (map.getCanvas().style.cursor = 'pointer'));
        map.on('mouseleave', layer, () => (map.getCanvas().style.cursor = ''));
      }

      const onClick = (
        e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }
      ) => {
        const f = e.features?.[0];
        if (!f) return;
        const id = f.properties?.id;
        const match = earthquakesRef.current.find((q) => q.earthquake_id === id);
        if (match) onSelect(match);
      };
      for (const layer of HIT_LAYERS) {
        map.on('click', layer, onClick);
      }

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
    map.flyTo({ center: [lng, lat], zoom: 7.2, duration: 1600, pitch: 0, bearing: 0 });
  }, [selected]);

  // Apply settings — view mode and layer toggles.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      const showHeat = settings.viewMode !== 'markers';
      const showMarkers = settings.viewMode !== 'heatmap';

      const setVis = (id: string, visible: boolean) => {
        if (map.getLayer(id)) {
          map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
        }
      };

      setVis('quakes-heat', showHeat);
      ['quakes-glow', 'quakes-ring', 'quakes-core', 'quakes-center', 'quakes-pulse'].forEach(
        (id) => setVis(id, showMarkers)
      );

      // Basemap toggles
      ['place-country', 'place-city-other', 'place-city-tr', 'place-town-tr', 'place-town-other'].forEach(
        (id) => setVis(id, settings.showLabels)
      );
      ['road-major', 'road-minor'].forEach((id) => setVis(id, settings.showHighways));
      setVis('boundary-state', settings.showProvinces);
    };

    if (map.isStyleLoaded()) apply();
    else map.once('load', apply);
  }, [settings]);

  return (
    <div
      ref={container}
      className="absolute inset-0"
      style={{ background: 'radial-gradient(ellipse at center, #0a0a12 0%, #03030a 70%)' }}
    />
  );
}

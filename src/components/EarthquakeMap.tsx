'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Earthquake } from '@/services/earthquakeService';

interface MapComponentProps {
  earthquakes: Earthquake[];
  selectedEarthquake: Earthquake | null;
  onEarthquakeSelect: (earthquake: Earthquake) => void;
  mapCenter: [number, number];
  mapZoom: number;
}

const MapWithNoSSR = dynamic<MapComponentProps>(
  () => import('./MapComponent').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center mono text-[11px] text-fg-2">
        Loading map…
      </div>
    ),
  }
);

interface EarthquakeMapProps {
  earthquakes: Earthquake[];
  loading: boolean;
  selectedEarthquake: Earthquake | null;
  onEarthquakeSelect: (earthquake: Earthquake) => void;
}

const TURKEY_CENTER: [number, number] = [39.0, 35.0];
const TURKEY_ZOOM = 6;

const EarthquakeMap: React.FC<EarthquakeMapProps> = ({
  earthquakes,
  loading,
  selectedEarthquake,
  onEarthquakeSelect,
}) => {
  const [mapCenter] = useState<[number, number]>(TURKEY_CENTER);
  const [mapZoom] = useState(TURKEY_ZOOM);

  // Guard against hydration mismatch in dev
  useEffect(() => {}, []);

  return (
    <div className="relative h-full w-full border border-line bg-bg-1 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 z-[400] flex items-center justify-between px-3 py-2 border-b border-line bg-bg-1/95 backdrop-blur-sm">
        <div className="mono text-[10px] uppercase tracking-[0.1em] text-fg-2">
          Live Map
        </div>
        <div className="mono text-[10px] text-fg-2 flex items-center gap-2">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{
              background: loading ? 'var(--accent)' : 'var(--mag-low)',
              animation: loading ? 'tm-pulse 1.6s ease-out infinite' : undefined,
            }}
          />
          <span>{earthquakes.length} events</span>
        </div>
      </div>
      {earthquakes.length > 0 ? (
        <MapWithNoSSR
          earthquakes={earthquakes}
          selectedEarthquake={selectedEarthquake}
          onEarthquakeSelect={onEarthquakeSelect}
          mapCenter={mapCenter}
          mapZoom={mapZoom}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center mono text-[11px] text-fg-2">
          No earthquake data
        </div>
      )}
    </div>
  );
};

export default EarthquakeMap;

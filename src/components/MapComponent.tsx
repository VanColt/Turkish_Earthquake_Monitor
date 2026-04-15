'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Earthquake } from '@/services/earthquakeService';
import TacticalMarker from './TacticalMarker';
import { magnitudeVar } from '@/lib/magnitude';

// Leaflet's default marker icon depends on assets that aren't bundled.
// @ts-expect-error — _getIconUrl exists at runtime but not in types
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: undefined, iconUrl: undefined, shadowUrl: undefined });

const MapUpdater = ({ selectedEarthquake }: { selectedEarthquake: Earthquake | null }) => {
  const map = useMap();
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (initialLoad) setInitialLoad(false);
  }, [initialLoad]);

  useEffect(() => {
    if (selectedEarthquake && !initialLoad) {
      const [lng, lat] = selectedEarthquake.geojson.coordinates;
      map.flyTo([lat, lng], 9, { duration: 1.2 });
    }
  }, [selectedEarthquake, map, initialLoad]);

  return null;
};

interface MapComponentProps {
  earthquakes: Earthquake[];
  selectedEarthquake: Earthquake | null;
  onEarthquakeSelect: (earthquake: Earthquake) => void;
  mapCenter: [number, number];
  mapZoom: number;
}

const MapComponent: React.FC<MapComponentProps> = ({
  earthquakes,
  selectedEarthquake,
  onEarthquakeSelect,
  mapCenter,
  mapZoom,
}) => {
  return (
    <MapContainer
      center={mapCenter}
      zoom={mapZoom}
      style={{
        height: 'calc(100% - 10px)',
        width: '100%',
        position: 'absolute',
        top: 0,
        bottom: 0,
      }}
      zoomControl
      attributionControl={false}
      doubleClickZoom={false}
      scrollWheelZoom
      dragging
      boxZoom={false}
      keyboard={false}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

      {earthquakes.map((earthquake) => {
        const [lng, lat] = earthquake.geojson.coordinates;
        const isSelected =
          selectedEarthquake?.earthquake_id === earthquake.earthquake_id;
        return (
          <TacticalMarker
            key={earthquake.earthquake_id}
            position={[lat, lng]}
            mag={earthquake.mag}
            depth={earthquake.depth}
            title={earthquake.title}
            selected={isSelected}
            onClick={() => onEarthquakeSelect(earthquake)}
          />
        );
      })}

      <MapUpdater selectedEarthquake={selectedEarthquake} />

      <div
        className="leaflet-bottom leaflet-right"
        style={{ position: 'absolute', right: 10, bottom: 10, zIndex: 1000 }}
      >
        <div
          className="leaflet-control leaflet-bar mono"
          style={{
            background: 'color-mix(in oklch, var(--bg-0) 85%, transparent)',
            border: '1px solid var(--line)',
            color: 'var(--fg-1)',
            padding: '8px 10px',
            borderRadius: 1,
            fontSize: 10,
            letterSpacing: '0.04em',
            minWidth: 140,
          }}
        >
          <div
            style={{
              color: 'var(--fg-2)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 6,
              fontSize: 9,
            }}
          >
            Magnitude
          </div>
          {[
            { label: '< 3.0', mag: 2 },
            { label: '3.0 – 4.9', mag: 4 },
            { label: '5.0 – 5.9', mag: 5.5 },
            { label: '≥ 6.0', mag: 6.5 },
          ].map(({ label, mag }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: magnitudeVar(mag),
                }}
              />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </MapContainer>
  );
};

export default MapComponent;

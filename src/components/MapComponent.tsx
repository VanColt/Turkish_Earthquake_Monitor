'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Earthquake, getMagnitudeColor, getMagnitudeSize, getMarkerOpacity } from '@/services/earthquakeService';
import CustomGradientMarker from './CustomGradientMarker';
import { Tag } from 'antd';

// Delete default icon references to prevent 404 errors
// This removes the need for marker-icon.png and marker-shadow.png
// Use type assertion to avoid TypeScript error
// @ts-ignore - _getIconUrl exists at runtime but is not in the type definitions
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: null,
  iconUrl: null,
  shadowUrl: null,
});

// Component to automatically update map view when selected earthquake changes
const MapUpdater = ({ 
  selectedEarthquake 
}: { 
  selectedEarthquake: Earthquake | null 
}) => {
  const map = useMap();
  const [initialLoad, setInitialLoad] = useState(true);
  
  // Track if this is the first render
  useEffect(() => {
    // After first render, set initialLoad to false
    if (initialLoad) {
      setInitialLoad(false);
    }
  }, [initialLoad]);
  
  // Handle map updates when selected earthquake changes
  useEffect(() => {
    // Only fly to selected earthquake if it's not the initial load
    // This ensures we stay centered on Turkey when the page first loads
    if (selectedEarthquake && !initialLoad) {
      const [lng, lat] = selectedEarthquake.geojson.coordinates;
      map.flyTo([lat, lng], 9, {
        duration: 1.5
      });
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

const formatDistance = (distance: number) => {
  return `${distance.toFixed(1)} km`;
};

const MapComponent: React.FC<MapComponentProps> = ({
  earthquakes,
  selectedEarthquake,
  onEarthquakeSelect,
  mapCenter,
  mapZoom
}) => {
  // Prevent map from shifting when clicked
  const handleMapClick = (e: L.LeafletMouseEvent) => {
    // Stop propagation to prevent default behavior
    e.originalEvent.stopPropagation();
  };
  
  return (
    <MapContainer
      center={mapCenter}
      zoom={mapZoom}
      style={{ height: 'calc(100% - 10px)', width: '100%', position: 'absolute', top: 0, bottom: 0 }}
      zoomControl={true}
      attributionControl={false}
      doubleClickZoom={false}
      scrollWheelZoom={true}
      dragging={true}
      boxZoom={false}
      keyboard={false}
    >
      {/* Dark map base layer */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      
      {earthquakes.map((earthquake) => {
        const [lng, lat] = earthquake.geojson.coordinates;
        const isSelected = selectedEarthquake?._id === earthquake._id;
        
        return (
          <div key={earthquake._id}>
            <CustomGradientMarker
              position={[lat, lng]}
              radius={getMagnitudeSize(earthquake.mag) * (isSelected ? 1.2 : 1)}
              color={getMagnitudeColor(earthquake.mag, earthquake.depth)}
              opacity={getMarkerOpacity(earthquake.mag, earthquake.depth)}
              onClick={() => onEarthquakeSelect(earthquake)}
            />
          </div>
        );
      })}
      
      <MapUpdater selectedEarthquake={selectedEarthquake} />
      
      {/* Add a custom legend - positioned with fixed coordinates */}
      <div className="leaflet-bottom leaflet-right" style={{ position: 'absolute', right: '10px', bottom: '10px', zIndex: 1000 }}>
        <div className="leaflet-control leaflet-bar" style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.7)', 
          padding: '8px', 
          borderRadius: '4px',
          border: '1px solid rgba(0, 200, 255, 0.3)',
          color: '#ffffff',
          width: '180px',
          boxShadow: '0 0 10px rgba(0, 200, 255, 0.3)'
        }}>
          <div className="font-bold mb-2">Earthquake Intensity</div>
          <div className="text-xs space-y-3">
            <div className="flex items-center">
              <div style={{ 
                width: '20px', 
                height: '20px', 
                borderRadius: '50%', 
                background: `radial-gradient(circle, ${getMagnitudeColor(2, 10)} 0%, rgba(0,0,0,0) 70%)`,
                marginRight: '8px' 
              }}></div>
              <span>Magnitude &lt; 3</span>
            </div>
            <div className="flex items-center">
              <div style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                background: `radial-gradient(circle, ${getMagnitudeColor(3.5, 10)} 0%, rgba(0,0,0,0) 70%)`,
                marginRight: '8px' 
              }}></div>
              <span>Magnitude 3-4</span>
            </div>
            <div className="flex items-center">
              <div style={{ 
                width: '28px', 
                height: '28px', 
                borderRadius: '50%', 
                background: `radial-gradient(circle, ${getMagnitudeColor(4.5, 10)} 0%, rgba(0,0,0,0) 70%)`,
                marginRight: '8px' 
              }}></div>
              <span>Magnitude 4-5</span>
            </div>
            <div className="flex items-center">
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                background: `radial-gradient(circle, ${getMagnitudeColor(5.5, 10)} 0%, rgba(0,0,0,0) 70%)`,
                marginRight: '8px' 
              }}></div>
              <span>Magnitude &gt; 5</span>
            </div>
            <div className="mt-3 text-blue-300">Intensity and size increase<br/>with magnitude</div>
            <div className="text-blue-300">Transparency varies with depth</div>
          </div>
        </div>
      </div>
    </MapContainer>
  );
};

export default MapComponent;

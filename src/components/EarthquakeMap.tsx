'use client';

import { useEffect, useState } from 'react';
import { Card, Spin, Typography, Tag, Empty } from 'antd';
import { Earthquake, getMagnitudeColor, getMagnitudeSize } from '@/services/earthquakeService';
import dynamic from 'next/dynamic';

// Define the interface for the MapComponent props
interface MapComponentProps {
  earthquakes: Earthquake[];
  selectedEarthquake: Earthquake | null;
  onEarthquakeSelect: (earthquake: Earthquake) => void;
  mapCenter: [number, number];
  mapZoom: number;
}

// Dynamically import the entire map component with no SSR
const MapWithNoSSR = dynamic<MapComponentProps>(
  () => import('./MapComponent').then(mod => mod.default),
  { ssr: false, loading: () => <div className="h-full w-full flex items-center justify-center">Loading map...</div> }
);

const { Title, Text } = Typography;

interface EarthquakeMapProps {
  earthquakes: Earthquake[];
  loading: boolean;
  selectedEarthquake: Earthquake | null;
  onEarthquakeSelect: (earthquake: Earthquake) => void;
}

// MapUpdater is now part of MapComponent

const EarthquakeMap: React.FC<EarthquakeMapProps> = ({
  earthquakes,
  loading,
  selectedEarthquake,
  onEarthquakeSelect
}) => {
  // Turkey's center coordinates
  const TURKEY_CENTER: [number, number] = [39.0, 35.0];
  const TURKEY_ZOOM = 6;
  
  const [mapCenter, setMapCenter] = useState<[number, number]>(TURKEY_CENTER);
  const [mapZoom, setMapZoom] = useState(TURKEY_ZOOM);
  
  // Reset map to Turkey center when component reloads
  useEffect(() => {
    setMapCenter(TURKEY_CENTER);
    setMapZoom(TURKEY_ZOOM);
  }, []);

  return (
    <Card 
      className="h-full shadow-md bg-transparent overflow-hidden" 
      styles={{ 
        body: { 
          padding: 0, 
          height: '100%',
          backgroundColor: 'transparent'
        } 
      }}
      variant="outlined"
      title={
        <div className="flex justify-between items-center">
          <Title level={5} className="m-0">Earthquake Map</Title>
          {loading && <Spin size="small" />}
        </div>
      }
    >
      {earthquakes.length > 0 ? (
        <div className="h-full w-full" style={{ height: 'calc(100% - 20px)' }}>
          <MapWithNoSSR 
            earthquakes={earthquakes}
            selectedEarthquake={selectedEarthquake}
            onEarthquakeSelect={onEarthquakeSelect}
            mapCenter={mapCenter}
            mapZoom={mapZoom}
          />
        </div>
      ) : (
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
          description="No earthquake data available"
          className="h-full flex flex-col justify-center"
        />
      )}
    </Card>
  );
};

export default EarthquakeMap;

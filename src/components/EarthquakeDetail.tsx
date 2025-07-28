'use client';

import React from 'react';
import { Card, Typography, Descriptions, Tag, Empty, Divider, List, Avatar } from 'antd';
import { ClockCircleOutlined, EnvironmentOutlined, ColumnHeightOutlined, AimOutlined, HomeOutlined, GlobalOutlined } from '@ant-design/icons';
import { Earthquake, getMagnitudeColor } from '@/services/earthquakeService';

const { Title, Text } = Typography;

interface EarthquakeDetailProps {
  earthquake: Earthquake | null;
}

const EarthquakeDetail: React.FC<EarthquakeDetailProps> = ({ earthquake }) => {
  if (!earthquake) {
    return (
      <Card className="h-full shadow-md">
        <Empty description="Select an earthquake to view details" />
      </Card>
    );
  }

  // Format distance to be more readable
  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${meters.toFixed(0)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  return (
    <Card 
      className="h-full shadow-md bg-transparent overflow-y-auto"
      styles={{ 
        body: { 
          backgroundColor: 'transparent', 
          height: '100%', 
          overflowY: 'auto', 
          paddingBottom: '12px',
          padding: '16px 12px' // Reduced horizontal padding for laptop screens
        } 
      }}
      variant="outlined"
      title={
        <div className="flex items-center flex-wrap gap-2">
          <Title level={5} className="m-0 text-sm lg:text-base leading-tight">
            {earthquake.title.length > 50 ? `${earthquake.title.substring(0, 50)}...` : earthquake.title}
          </Title>
          <Tag color={getMagnitudeColor(earthquake.mag)} className="text-xs">
            M{earthquake.mag?.toFixed(1) || 'N/A'}
          </Tag>
        </div>
      }
    >
      <Descriptions 
        column={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 2 }} 
        size="small" 
        bordered={true}
        className="mb-4"
        styles={{ 
          label: { fontSize: '12px', fontWeight: '500' },
          content: { fontSize: '12px' } 
        }}
      >
        <Descriptions.Item 
          label={<span className="text-xs"><ClockCircleOutlined className="mr-1" /> Date & Time</span>}
          span={2}
        >
          <div className="text-xs leading-relaxed">
            {new Date(earthquake.date_time).toLocaleString()}
            <br className="sm:hidden" />
            <span className="text-gray-500 ml-0 sm:ml-2">({earthquake.location_tz})</span>
          </div>
        </Descriptions.Item>
        
        <Descriptions.Item 
          label={<span className="text-xs"><EnvironmentOutlined className="mr-1" /> Coordinates</span>}
        >
          <Text className="text-xs font-mono">
            {earthquake.geojson.coordinates[1].toFixed(4)}, {earthquake.geojson.coordinates[0].toFixed(4)}
          </Text>
        </Descriptions.Item>
        
        <Descriptions.Item 
          label={<span className="text-xs"><AimOutlined className="mr-1" /> Depth</span>}
        >
          <Text className="text-xs font-semibold">{earthquake.depth} km</Text>
        </Descriptions.Item>
        
        <Descriptions.Item 
          label={<span className="text-xs"><HomeOutlined className="mr-1" /> Epicenter</span>}
          span={2}
        >
          <div className="text-xs">
            <div className="font-medium">{earthquake.location_properties.epiCenter.name}</div>
            {earthquake.location_properties.epiCenter.population && (
              <Text type="secondary" className="text-xs">
                Population: {earthquake.location_properties.epiCenter.population.toLocaleString()}
              </Text>
            )}
          </div>
        </Descriptions.Item>
      </Descriptions>

      <Divider orientation="left" className="my-3 text-sm font-medium">Closest Cities</Divider>
      
      <List
        size="small"
        className="mb-4"
        dataSource={earthquake.location_properties.closestCities.slice(0, 3)} // Limit to 3 cities for better space usage
        renderItem={(city) => (
          <List.Item className="py-2">
            <List.Item.Meta
              avatar={<Avatar size="small" icon={<GlobalOutlined />} className="bg-blue-500" />}
              title={<span className="text-sm font-medium">{city.name}</span>}
              description={
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <Text type="secondary" className="text-xs">
                      Distance: {formatDistance(city.distance)}
                    </Text>
                    <Text type="secondary" className="text-xs">
                      Pop: {(city.population / 1000).toFixed(0)}K
                    </Text>
                  </div>
                </div>
              }
            />
          </List.Item>
        )}
      />

      {earthquake.location_properties.airports && earthquake.location_properties.airports.length > 0 && (
        <>
          <Divider orientation="left" className="my-3 text-sm font-medium">Nearby Airports</Divider>
          
          <List
            size="small"
            dataSource={earthquake.location_properties.airports.slice(0, 2)} // Limit to 2 airports
            renderItem={(airport) => (
              <List.Item className="py-2">
                <List.Item.Meta
                  avatar={<Avatar size="small" className="bg-orange-500">✈️</Avatar>}
                  title={
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{airport.name}</span>
                      <Tag className="text-xs">{airport.code}</Tag>
                    </div>
                  }
                  description={
                    <Text type="secondary" className="text-xs">
                      Distance: {formatDistance(airport.distance)}
                    </Text>
                  }
                />
              </List.Item>
            )}
          />
        </>
      )}
    </Card>
  );
};

export default EarthquakeDetail;

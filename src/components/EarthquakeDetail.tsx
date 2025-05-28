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
      styles={{ body: { backgroundColor: 'transparent', height: '100%', overflowY: 'auto', paddingBottom: '16px' } }}
      variant="outlined"
      title={
        <div className="flex items-center">
          <Title level={5} className="m-0 mr-2">{earthquake.title}</Title>
          <Tag color={getMagnitudeColor(earthquake.mag)}>M{earthquake.mag.toFixed(1)}</Tag>
        </div>
      }
    >
      <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered={true}>
        <Descriptions.Item 
          label={<span><ClockCircleOutlined className="mr-1" /> Date & Time</span>}
          span={2}
        >
          {new Date(earthquake.date_time).toLocaleString()} ({earthquake.location_tz})
        </Descriptions.Item>
        
        <Descriptions.Item 
          label={<span><EnvironmentOutlined className="mr-1" /> Coordinates</span>}
        >
          {earthquake.geojson.coordinates[1].toFixed(4)}, {earthquake.geojson.coordinates[0].toFixed(4)}
        </Descriptions.Item>
        
        <Descriptions.Item 
          label={<span><AimOutlined className="mr-1" /> Depth</span>}
        >
          {earthquake.depth} km
        </Descriptions.Item>
        
        <Descriptions.Item 
          label={<span><HomeOutlined className="mr-1" /> Epicenter</span>}
          span={2}
        >
          {earthquake.location_properties.epiCenter.name}
          {earthquake.location_properties.epiCenter.population && (
            <Text type="secondary" className="ml-2">
              (Pop: {earthquake.location_properties.epiCenter.population.toLocaleString()})
            </Text>
          )}
        </Descriptions.Item>
      </Descriptions>

      <Divider orientation="left">Closest Cities</Divider>
      
      <List
        size="small"
        dataSource={earthquake.location_properties.closestCities}
        renderItem={(city) => (
          <List.Item>
            <List.Item.Meta
              avatar={<Avatar icon={<GlobalOutlined />} />}
              title={city.name}
              description={
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <Text type="secondary">Distance: {formatDistance(city.distance)}</Text>
                  <Text type="secondary">Population: {city.population.toLocaleString()}</Text>
                </div>
              }
            />
          </List.Item>
        )}
      />

      <Divider orientation="left">Nearby Airports</Divider>
      
      <List
        size="small"
        dataSource={earthquake.location_properties.airports}
        renderItem={(airport) => (
          <List.Item>
            <List.Item.Meta
              avatar={<Avatar>✈️</Avatar>}
              title={
                <div className="flex items-center">
                  {airport.name}
                  <Tag className="ml-2">{airport.code}</Tag>
                </div>
              }
              description={`Distance: ${formatDistance(airport.distance)}`}
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

export default EarthquakeDetail;

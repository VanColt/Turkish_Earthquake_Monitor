'use client';

import React from 'react';
import { Card, Statistic, Row, Col, Typography, Progress, Tooltip, Badge, Spin } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Earthquake, getMagnitudeColor } from '@/services/earthquakeService';

const { Title, Text } = Typography;

interface EarthquakeStatsProps {
  earthquakes: Earthquake[];
  loading: boolean;
  metadata: {
    date_starts: string;
    date_ends: string;
    total: number;
  } | null;
}

const EarthquakeStats: React.FC<EarthquakeStatsProps> = ({ earthquakes, loading, metadata }) => {
  // Calculate statistics
  const calculateStats = () => {
    if (!earthquakes.length) return null;
    
    const totalEarthquakes = earthquakes.length;
    const averageMagnitude = earthquakes.reduce((sum, eq) => sum + eq.mag, 0) / totalEarthquakes;
    const averageDepth = earthquakes.reduce((sum, eq) => sum + eq.depth, 0) / totalEarthquakes;
    
    // Count earthquakes by magnitude range
    const magnitudeRanges = {
      minor: earthquakes.filter(eq => eq.mag < 3).length,
      light: earthquakes.filter(eq => eq.mag >= 3 && eq.mag < 4).length,
      moderate: earthquakes.filter(eq => eq.mag >= 4 && eq.mag < 5).length,
      strong: earthquakes.filter(eq => eq.mag >= 5 && eq.mag < 6).length,
      major: earthquakes.filter(eq => eq.mag >= 6).length,
    };
    
    // Find strongest earthquake
    const strongestEarthquake = earthquakes.reduce(
      (strongest, current) => (current.mag > strongest.mag ? current : strongest),
      earthquakes[0]
    );
    
    // Find most recent earthquake
    const mostRecent = earthquakes.reduce(
      (latest, current) => {
        const latestDate = new Date(latest.date_time).getTime();
        const currentDate = new Date(current.date_time).getTime();
        return currentDate > latestDate ? current : latest;
      },
      earthquakes[0]
    );
    
    return {
      totalEarthquakes,
      averageMagnitude,
      averageDepth,
      magnitudeRanges,
      strongestEarthquake,
      mostRecent,
    };
  };
  
  const stats = calculateStats();
  
  if (!stats) {
    return (
      <Card loading={loading} className="h-full shadow-md bg-transparent" variant="outlined">
        <div className="h-full flex items-center justify-center">
          <Spin size="large" />
        </div>
      </Card>
    );
  }
  
  const timeFrame = metadata ? 
    `${new Date(metadata.date_starts).toLocaleString()} - ${new Date(metadata.date_ends).toLocaleString()}` : 
    'Last 24 hours';

  return (
    <Card 
      className="shadow-md bg-transparent" 
      styles={{ body: { backgroundColor: 'transparent', padding: '12px' } }}
      variant="outlined"
      title={
        <div className="flex justify-between items-center">
          <Title level={5} className="m-0">Earthquake Statistics</Title>
          <Tooltip title={timeFrame}>
            <InfoCircleOutlined className="text-gray-400" />
          </Tooltip>
        </div>
      }
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card variant="borderless" size="small">
            <Statistic
              title="Total Earthquakes"
              value={stats.totalEarthquakes}
              precision={0}
              valueStyle={{ color: '#1677ff' }}
            />
            {metadata && metadata.total > stats.totalEarthquakes && (
              <Text type="secondary" className="block mt-2">
                {metadata.total - stats.totalEarthquakes} more in full dataset
              </Text>
            )}
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={8}>
          <Card variant="borderless" size="small">
            <Statistic
              title="Average Magnitude"
              value={stats.averageMagnitude}
              precision={1}
              valueStyle={{ color: getMagnitudeColor(stats.averageMagnitude) }}
              prefix="M"
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={8}>
          <Card variant="borderless" size="small">
            <Statistic
              title="Average Depth"
              value={stats.averageDepth}
              precision={1}
              suffix="km"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card variant="borderless" size="small" title="Magnitude Distribution">
            <div className="space-y-2">
              <div>
                <div className="flex justify-between mb-1">
                  <Text>Minor (&lt;3.0)</Text>
                  <Text>{stats.magnitudeRanges.minor}</Text>
                </div>
                <Progress 
                  percent={(stats.magnitudeRanges.minor / stats.totalEarthquakes) * 100} 
                  showInfo={false} 
                  strokeColor="#52c41a" 
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <Text>Light (3.0-3.9)</Text>
                  <Text>{stats.magnitudeRanges.light}</Text>
                </div>
                <Progress 
                  percent={(stats.magnitudeRanges.light / stats.totalEarthquakes) * 100} 
                  showInfo={false} 
                  strokeColor="#faad14" 
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <Text>Moderate (4.0-4.9)</Text>
                  <Text>{stats.magnitudeRanges.moderate}</Text>
                </div>
                <Progress 
                  percent={(stats.magnitudeRanges.moderate / stats.totalEarthquakes) * 100} 
                  showInfo={false} 
                  strokeColor="#fa8c16" 
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <Text>Strong (5.0-5.9)</Text>
                  <Text>{stats.magnitudeRanges.strong}</Text>
                </div>
                <Progress 
                  percent={(stats.magnitudeRanges.strong / stats.totalEarthquakes) * 100} 
                  showInfo={false} 
                  strokeColor="#f5222d" 
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <Text>Major (≥6.0)</Text>
                  <Text>{stats.magnitudeRanges.major}</Text>
                </div>
                <Progress 
                  percent={(stats.magnitudeRanges.major / stats.totalEarthquakes) * 100} 
                  showInfo={false} 
                  strokeColor="#a8071a" 
                />
              </div>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card variant="borderless" size="small" title="Notable Events">
            <div className="space-y-4">
              <div>
                <Text type="secondary">Strongest Earthquake</Text>
                <div className="flex items-center mt-1">
                  <Badge 
                    count={`M${stats.strongestEarthquake.mag.toFixed(1)}`} 
                    style={{ backgroundColor: getMagnitudeColor(stats.strongestEarthquake.mag) }} 
                  />
                  <Text strong className="ml-2 truncate">{stats.strongestEarthquake.title}</Text>
                </div>
                <Text type="secondary" className="block mt-1">
                  {new Date(stats.strongestEarthquake.date_time).toLocaleString()}
                </Text>
              </div>
              
              <div>
                <Text type="secondary">Most Recent Earthquake</Text>
                <div className="flex items-center mt-1">
                  <Badge 
                    count={`M${stats.mostRecent.mag.toFixed(1)}`} 
                    style={{ backgroundColor: getMagnitudeColor(stats.mostRecent.mag) }} 
                  />
                  <Text strong className="ml-2 truncate">{stats.mostRecent.title}</Text>
                </div>
                <Text type="secondary" className="block mt-1">
                  {new Date(stats.mostRecent.date_time).toLocaleString()}
                </Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </Card>
  );
};

export default EarthquakeStats;

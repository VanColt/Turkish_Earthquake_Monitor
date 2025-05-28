'use client';

import React from 'react';
import { Row, Col, Select, DatePicker, Button, Typography, Space, Tooltip, Badge, Divider, Image } from 'antd';
import { InfoCircleOutlined, GithubOutlined, LinkedinOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface DashboardHeaderProps {
  loading: boolean;
  lastUpdated: Date | null;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  loading,
  lastUpdated
}) => {
  return (
    <div className="text-gray-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between px-4 py-2">
        <div className="flex items-center mb-4 md:mb-0">
          <div className="flex-shrink-0 mr-8 flex items-center">
            <Image 
              src="/tr.png" 
              alt="Turkey Map" 
              width={56} 
              height={56} 
              preview={false}
              style={{ filter: 'brightness(0) invert(1)' }} // Makes the image white
            />
          </div>
          <div className="flex flex-col justify-center">
            <Title level={3} className="m-0 mb-0 text-gray-300">Turkish Earthquake Monitor</Title>
            <div className="flex items-center">
              {lastUpdated && (
                <Text className="text-gray-400 flex items-center">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                  <Tooltip title="Real-time earthquake data visualization for Turkey">
                    <InfoCircleOutlined className="ml-2 text-gray-400 hover:text-gray-300 cursor-pointer" />
                  </Tooltip>
                </Text>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 pr-2">
          <Tooltip title="GitHub">
            <Button 
              type="text"
              icon={<GithubOutlined />} 
              size="large"
              href="https://github.com/mrtuy"
              target="_blank"
              className="text-gray-300 hover:text-white"
            />
          </Tooltip>
          
          <Tooltip title="LinkedIn">
            <Button 
              type="text"
              icon={<LinkedinOutlined />} 
              size="large"
              href="https://linkedin.com/in/mrtuy"
              target="_blank"
              className="text-gray-300 hover:text-white"
            />
          </Tooltip>
          
          <Tooltip title="About this project">
            <Button 
              type="text"
              icon={<InfoCircleOutlined />} 
              size="large"
              className="text-gray-300 hover:text-white"
            />
          </Tooltip>
        </div>
      </div>
      
      {/* Date Range, Min Magnitude, and settings removed as requested */}
    </div>
  );
};

export default DashboardHeader;

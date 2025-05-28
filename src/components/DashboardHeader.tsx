'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Row, Col, Select, DatePicker, Button, Typography, Space, Tooltip, Badge, Divider, Image, Modal } from 'antd';
import { InfoCircleOutlined, GithubOutlined, LinkedinOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface DashboardHeaderProps {
  loading: boolean;
  lastUpdated: Date | null;
  nextRefreshTime?: Date | null;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  loading,
  lastUpdated,
  nextRefreshTime
}) => {
  const [isAboutModalVisible, setIsAboutModalVisible] = useState(false);
  
  // Use refs for DOM elements and values
  const nextRefreshTimeRef = useRef<Date | null>(null);
  const countdownElementRef = useRef<HTMLSpanElement>(null);
  
  // Update the ref when the prop changes
  useEffect(() => {
    nextRefreshTimeRef.current = nextRefreshTime || null;
  }, [nextRefreshTime]);
  
  // Set up the interval only once
  useEffect(() => {
    // Only set up if we have a next refresh time
    if (!nextRefreshTimeRef.current) return;
    
    const updateCountdownDOM = () => {
      if (!nextRefreshTimeRef.current || !countdownElementRef.current) return;
      
      const now = new Date();
      const diff = nextRefreshTimeRef.current.getTime() - now.getTime();
      
      if (diff <= 0) {
        countdownElementRef.current.textContent = 'Refreshing...';
        return;
      }
      
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      countdownElementRef.current.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };
    
    // Update immediately
    updateCountdownDOM();
    
    // Update every second
    const intervalId = setInterval(updateCountdownDOM, 1000);
    
    return () => clearInterval(intervalId);
  }, [nextRefreshTime]); // Only re-run when nextRefreshTime changes
  
  const showAboutModal = () => {
    setIsAboutModalVisible(true);
  };
  
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
              <div className="flex flex-col">
                {lastUpdated && (
                  <div className="text-gray-400 flex items-center text-sm">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                    <span className="ml-2 text-gray-400 hover:text-gray-300 cursor-pointer" title="Real-time earthquake data from Kandilli Observatory and Earthquake Research Institute, Boğaziçi University">
                      <InfoCircleOutlined />
                    </span>
                    <span className="ml-2 text-gray-500 opacity-50 text-xs">Next update: <span ref={countdownElementRef}></span></span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 pr-2">
          <Button 
            type="text"
            icon={<GithubOutlined />} 
            size="large"
            href="https://github.com/VanColt/Turkish_Earthquake_Monitor"
            target="_blank"
            className="text-gray-300 hover:text-white"
            title="GitHub"
          />
          
          <Button 
            type="text"
            icon={<LinkedinOutlined />} 
            size="large"
            href="https://www.linkedin.com/in/mert-uysal/"
            target="_blank"
            className="text-gray-300 hover:text-white"
            title="LinkedIn"
          />
          
          <Button 
            type="text"
            icon={<InfoCircleOutlined />} 
            size="large"
            className="text-gray-300 hover:text-white"
            onClick={showAboutModal}
            title="About this project"
          />
        </div>
      </div>
      
      {/* Date Range, Min Magnitude, and settings removed as requested */}
      
      {/* About Modal */}
      <Modal
        title={null}
        open={isAboutModalVisible}
        onCancel={() => setIsAboutModalVisible(false)}
        footer={null}
        width={500}
        className="about-modal"
        centered
        closeIcon={<div className="text-white hover:text-gray-300 text-xl absolute right-4 top-4 z-10">&times;</div>}
        modalRender={(node) => (
          <div className="rounded-xl overflow-hidden">{node}</div>
        )}
        styles={{
          mask: {
            backgroundColor: 'rgba(0, 0, 0, 0.45)'
          },
          content: {
            padding: 0,
            backgroundColor: 'transparent',
            boxShadow: 'none'
          }
        }}
      >
        <div className="text-white p-6 rounded-xl backdrop-blur-md bg-black/20">
          <div className="text-center mb-8">
            <div className="mb-4">
              <img 
                src="/tr.png" 
                alt="Turkey Flag" 
                className="w-16 h-16 mx-auto"
                style={{ filter: 'brightness(0) invert(1)' }} 
              />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">Turkish Earthquake Monitor</h2>
            <p className="text-gray-400 text-sm">Real-time earthquake data visualization</p>
          </div>
          
          <div className="mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="mr-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white">
                  <img 
                    src="https://avatars.githubusercontent.com/u/52379675" 
                    alt="Mert Uysal" 
                    className="w-full h-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = '/tr.png';
                      target.style.filter = 'brightness(0) invert(1)';
                    }}
                  />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold">Mert Uysal</h3>
                <div className="flex space-x-3 mt-1">
                  <a href="https://github.com/VanColt" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-200">
                    <GithubOutlined style={{ fontSize: '20px' }} />
                  </a>
                  <a href="https://www.linkedin.com/in/mert-uysal/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-200">
                    <LinkedinOutlined style={{ fontSize: '20px' }} />
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 border-b border-white/20 pb-2 text-white">Key Features</h3>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-white/10 p-2 rounded-md mr-3">
                  <span className="text-xl">🌍</span>
                </div>
                <div>
                  <h4 className="font-bold text-white">Interactive Map Visualization</h4>
                  <p className="text-white/80 text-sm">Real-time earthquake data displayed on an interactive map with magnitude-based markers</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-white/10 p-2 rounded-md mr-3">
                  <span className="text-xl">📊</span>
                </div>
                <div>
                  <h4 className="font-bold text-white">Advanced Analytics</h4>
                  <p className="text-white/80 text-sm">Comprehensive statistics and data analysis of seismic activities across Turkey</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-white/10 p-2 rounded-md mr-3">
                  <span className="text-xl">⚡</span>
                </div>
                <div>
                  <h4 className="font-bold text-white">Real-time Updates</h4>
                  <p className="text-white/80 text-sm">Automatic data refresh every 5 minutes with detailed information for each event</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center border-t border-white/20 pt-4">
            <p className="text-white italic text-sm mb-3">Made with ❤️ in Turkey with a hope of never to use it for emergency purposes</p>
            <a 
              href="https://github.com/VanColt/Turkish_Earthquake_Monitor" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-md transition-colors backdrop-blur-sm"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DashboardHeader;

'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ConfigProvider, theme, Layout, Modal, Drawer, Button } from 'antd';
import { Squares } from '@/components/ui/squares-background';
import { CloseCircleOutlined, InfoCircleOutlined, GithubOutlined, LinkedinOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

// Components
import DashboardHeader from '@/components/DashboardHeader';
import EarthquakeMap from '@/components/EarthquakeMap';
import EarthquakeTable from '@/components/EarthquakeTable';
import EarthquakeDetail from '@/components/EarthquakeDetail';
import EarthquakeStats from '@/components/EarthquakeStats';

// Services
import {
  Earthquake,
  EarthquakeResponse,
  fetchLiveEarthquakes,
  fetchFilteredEarthquakes,
  exportToCSV,
  FilterParams
} from '@/services/earthquakeService';

const { Content } = Layout;
const { useToken } = theme;

// Custom notification state
const useNotification = () => {
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | null}>({message: '', type: null});
  
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({message, type});
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setNotification({message: '', type: null});
    }, 3000);
  };
  
  return {
    notification,
    showSuccess: (message: string) => showNotification(message, 'success'),
    showError: (message: string) => showNotification(message, 'error')
  };
};

export default function Home() {
  const { token } = useToken();
  
  // Use our custom notification system instead of Ant Design's message API
  const { notification, showSuccess, showError } = useNotification();
  
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [filteredEarthquakes, setFilteredEarthquakes] = useState<Earthquake[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedEarthquake, setSelectedEarthquake] = useState<Earthquake | null>(null);
  const [magnitudeFilter, setMagnitudeFilter] = useState<number>(0);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [metadata, setMetadata] = useState<EarthquakeResponse['metadata'] | null>(null);
  const [mobileDetailVisible, setMobileDetailVisible] = useState<boolean>(false);
  const [statsDrawerVisible, setStatsDrawerVisible] = useState<boolean>(false);
  
  // Use refs for caching logic to avoid re-renders
  const lastFetchTimeRef = useRef<Date | null>(null);
  const earthquakesRef = useRef<Earthquake[]>([]);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use ref for refresh timing to avoid re-renders
  const nextRefreshTimeRef = useRef<Date | null>(null);
  
  // Function to get the current 5-minute interval time
  const getCurrentIntervalTime = () => {
    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = Math.floor(minutes / 5) * 5;
    
    const roundedTime = new Date(now);
    roundedTime.setMinutes(roundedMinutes);
    roundedTime.setSeconds(0);
    roundedTime.setMilliseconds(0);
    
    return roundedTime;
  };
  
  // Function to get the next refresh time (nearest 5-minute mark)
  const getNextRefreshTime = () => {
    const now = new Date();
    const minutes = now.getMinutes();
    const nextRefreshMinutes = Math.ceil(minutes / 5) * 5;
    
    const nextRefresh = new Date(now);
    nextRefresh.setMinutes(nextRefreshMinutes);
    nextRefresh.setSeconds(0);
    nextRefresh.setMilliseconds(0);
    
    // If we calculated the current time (due to rounding), add 5 minutes
    if (nextRefresh <= now) {
      nextRefresh.setMinutes(nextRefresh.getMinutes() + 5);
    }
    
    return nextRefresh;
  };
  
  // State to track the current and next refresh times
  const [currentIntervalTime, setCurrentIntervalTime] = useState<Date>(getCurrentIntervalTime());
  const [nextRefreshTime, setNextRefreshTime] = useState<Date>(getNextRefreshTime());
  
  // Fetch earthquake data - memoized without circular dependencies
  const fetchEarthquakes = useCallback(async () => {
    try {
      // Get the current 5-minute interval time
      const currentInterval = getCurrentIntervalTime();
      
      // Check if we already fetched data for this interval
      // Only fetch new data if:
      // 1. We haven't fetched any data yet (lastFetchTimeRef.current is null)
      // 2. The current interval is different from when we last fetched
      // 3. Filter parameters have changed (dateRange or magnitudeFilter)
      const shouldFetchNewData = 
        !lastFetchTimeRef.current || 
        currentInterval.getTime() > lastFetchTimeRef.current.getTime() ||
        dateRange || 
        magnitudeFilter > 0;
      
      if (!shouldFetchNewData) {
        console.log('Using cached earthquake data for this 5-minute interval');
        return;
      }
      
      setLoading(true);
      let response;
      
      if (dateRange || magnitudeFilter > 0) {
        const params: FilterParams = {};
        
        if (magnitudeFilter > 0) {
          params.min_mag = magnitudeFilter;
        }
        
        if (dateRange && dateRange[0] && dateRange[1]) {
          params.start_date = dateRange[0].format('YYYY-MM-DD HH:mm:ss');
          params.end_date = dateRange[1].format('YYYY-MM-DD HH:mm:ss');
        }
        
        response = await fetchFilteredEarthquakes(params);
      } else {
        response = await fetchLiveEarthquakes();
      }
      
      // Check if we have previous earthquake data to compare
      let newLogsCount = 0;
      if (earthquakesRef.current.length > 0) {
        // Count how many new earthquakes we have by comparing IDs
        const existingIds = new Set(earthquakesRef.current.map(eq => eq.earthquake_id));
        newLogsCount = response.result.filter(eq => !existingIds.has(eq.earthquake_id)).length;
      }
      
      // Update refs before state to ensure consistency
      const hasExistingData = !!lastFetchTimeRef.current;
      lastFetchTimeRef.current = currentInterval;
      earthquakesRef.current = response.result;
      
      // Update state variables
      setEarthquakes(response.result);
      setFilteredEarthquakes(response.result);
      setMetadata(response.metadata);
      setLastUpdated(currentInterval);
      setCurrentIntervalTime(currentInterval);
      
      // Only show notification if this isn't the initial page load
      if (hasExistingData) {
        // Show appropriate notification based on new logs count
        if (newLogsCount > 0) {
          showSuccess(`Updated: ${newLogsCount} New Log${newLogsCount > 1 ? 's' : ''}`);
        } else {
          showSuccess('Updated');
        }
      }
    } catch (error) {
      console.error('Error fetching earthquake data:', error);
      showError('Failed to load earthquake data');
    } finally {
      setLoading(false);
    }
  }, [dateRange, magnitudeFilter, showSuccess, showError]);
  
  // Initial data fetch and setup refresh schedule
  useEffect(() => {
    // Fetch data immediately on load
    fetchEarthquakes();
    
    // Calculate time until next 5-minute interval
    const calculateNextRefresh = () => {
      const now = new Date();
      const next = getNextRefreshTime();
      return next.getTime() - now.getTime();
    };
    
    // Set up the first timeout to align with 5-minute intervals
    refreshTimeoutRef.current = setTimeout(() => {
      // Fetch data at the 5-minute mark
      fetchEarthquakes();
      
      // Calculate the next refresh time for display
      const nextRefresh = getNextRefreshTime();
      setNextRefreshTime(nextRefresh);
      
      // Then set up regular 5-minute interval
      refreshIntervalRef.current = setInterval(() => {
        // Fetch the data
        fetchEarthquakes();
        
        // Update the next refresh time for display
        const newNextRefresh = getNextRefreshTime();
        setNextRefreshTime(newNextRefresh);
      }, 5 * 60 * 1000);
    }, calculateNextRefresh());
    
    // Cleanup function
    return () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [fetchEarthquakes]);

  // Handle magnitude filter change
  const handleMagnitudeFilterChange = (value: number) => {
    setMagnitudeFilter(value);
  };
  
  // Handle date range change
  const handleDateRangeChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
    setDateRange(dates);
  };
  
  // Handle earthquake selection
  const handleEarthquakeSelect = (earthquake: Earthquake) => {
    setSelectedEarthquake(earthquake);
    
    // On mobile, show the detail drawer when an earthquake is selected
    if (window.innerWidth < 768) {
      setMobileDetailVisible(true);
    }
  };
  
  // Export data as CSV
  const handleExportData = () => {
    if (filteredEarthquakes.length === 0) {
      showError('No data to export');
      return;
    }
    
    const csv = exportToCSV(filteredEarthquakes);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `turkish_earthquakes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showSuccess('Data exported successfully');
  };
  
  // Show about modal
  const showAboutModal = () => {
    Modal.info({
      title: 'About Turkish Earthquake Monitor',
      content: (
        <div>
          <p>This dashboard displays real-time earthquake data from the Kandilli Observatory and Earthquake Research Institute.</p>
          <p>Data is refreshed automatically every 5 minutes.</p>
          <p>API provided by: <a href="https://api.orhanaydogdu.com.tr/deprem/api-docs/" target="_blank" rel="noopener noreferrer">api.orhanaydogdu.com.tr</a></p>
          <p>Created by: <a href="https://github.com/VanColt" target="_blank" rel="noopener noreferrer">@VanColt</a> | <a href="https://www.linkedin.com/in/mert-uysal/" target="_blank" rel="noopener noreferrer">Mert Uysal</a></p>
          <p>Project Repository: <a href="https://github.com/VanColt/Turkish_Earthquake_Monitor" target="_blank" rel="noopener noreferrer">Turkish_Earthquake_Monitor</a></p>
        </div>
      ),
      okText: 'Close',
    });
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: 'oklch(0.2 0 0)',
          borderRadius: 8,
          colorBgContainer: '#141414',
          colorBgElevated: '#1f1f1f',
          colorBgLayout: '#0a0a0a',
          colorText: '#e6e6e6',
        },
        components: {
          Card: {
            headerBg: '#1f1f1f',
            colorBorderSecondary: '#303030',
          },
          Table: {
            colorBgContainer: '#141414',
            headerBg: '#1f1f1f',
          },
          Drawer: {
            colorBgElevated: '#141414',
          },
          Modal: {
            contentBg: '#141414',
          },
        },
      }}
    >
      {/* Custom notification UI */}
      {notification.type && (
        <div className="fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg animate-fade-in" 
             style={{ 
               backgroundColor: notification.type === 'success' ? 'rgba(0, 128, 0, 0.9)' : 'rgba(220, 0, 0, 0.9)',
               minWidth: '250px',
               maxWidth: '400px'
             }}>
          <div className="text-white font-medium">{notification.message}</div>
        </div>
      )}
      <Layout className="min-h-screen relative" style={{ backgroundColor: 'oklch(0.1 0 0)' }}>
        <div className="absolute inset-0 z-0 opacity-70" style={{ pointerEvents: 'none' }}>
          <Squares 
            direction="diagonal"
            speed={0.3}
            squareSize={60}
            borderColor="oklch(0.4 0 0)"
            hoverFillColor="oklch(0.35 0 0)"
            className="w-full h-full"
          />
        </div>
        <Content className="p-4 md:p-6 max-w-[1920px] mx-auto relative z-10">
          <div className="mb-6" style={{ backgroundColor: 'oklch(0.2 0 0)', borderRadius: '0.5rem', padding: '1rem', borderWidth: '1px', borderColor: 'oklch(0.15 0 0)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <DashboardHeader
              loading={loading}
              lastUpdated={lastUpdated}
              nextRefreshTime={nextRefreshTime}
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
            {/* Map Section */}
            <div className="lg:col-span-8 backdrop-blur-sm rounded-lg p-4 shadow-xl" style={{ backgroundColor: 'oklch(0.2 0 0 / 0.7)', borderWidth: '1px', borderColor: 'oklch(0.15 0 0 / 0.5)' }}>
              <div className="h-[500px] md:h-[600px]">
                <EarthquakeMap
                  earthquakes={filteredEarthquakes}
                  loading={loading}
                  selectedEarthquake={selectedEarthquake}
                  onEarthquakeSelect={handleEarthquakeSelect}
                />
              </div>
            </div>
            
            {/* Detail Section */}
            <div className="lg:col-span-4 hidden md:block backdrop-blur-sm rounded-lg p-4 shadow-xl" style={{ backgroundColor: 'oklch(0.2 0 0 / 0.7)', borderWidth: '1px', borderColor: 'oklch(0.15 0 0 / 0.5)' }}>
              <div className="h-[500px] md:h-[600px] overflow-auto">
                <EarthquakeDetail earthquake={selectedEarthquake} />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Data Table Section */}
            <div className="lg:col-span-8 backdrop-blur-sm rounded-lg p-4 shadow-xl" style={{ backgroundColor: 'oklch(0.2 0 0 / 0.7)', borderWidth: '1px', borderColor: 'oklch(0.15 0 0 / 0.5)' }}>
              <EarthquakeTable
                earthquakes={filteredEarthquakes}
                loading={loading}
                onEarthquakeSelect={handleEarthquakeSelect}
                selectedEarthquake={selectedEarthquake}
              />
            </div>
            
            {/* Statistics Section */}
            <div className="lg:col-span-4 hidden md:block backdrop-blur-sm rounded-lg p-4 shadow-xl" style={{ backgroundColor: 'oklch(0.2 0 0 / 0.7)', borderWidth: '1px', borderColor: 'oklch(0.15 0 0 / 0.5)', height: 'fit-content', maxHeight: '600px', overflowY: 'auto' }}>
              <EarthquakeStats
                earthquakes={filteredEarthquakes}
                loading={loading}
                metadata={metadata}
              />
              <div className="flex items-center space-x-4 pr-2 mt-4">
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
          </div>
          
          {/* Mobile drawer for earthquake details */}
          <Drawer
            title={<span className="text-gray-300 font-semibold">Earthquake Details</span>}
            placement="bottom"
            height="80vh"
            open={mobileDetailVisible}
            onClose={() => setMobileDetailVisible(false)}
            className="md:hidden"
            styles={{
              header: { borderBottom: '1px solid oklch(0.3 0 0)', paddingBottom: 16 },
              body: { backgroundColor: 'oklch(0.15 0 0)', padding: 0 },
            }}
            closeIcon={<CloseCircleOutlined className="text-gray-400 hover:text-gray-300" />}
          >
            <div className="p-4">
              <EarthquakeDetail earthquake={selectedEarthquake} />
            </div>
          </Drawer>
          
          {/* Mobile drawer for statistics */}
          <Drawer
            title={<span className="text-gray-300 font-semibold">Statistical Analysis</span>}
            placement="right"
            width="90vw"
            open={statsDrawerVisible}
            onClose={() => setStatsDrawerVisible(false)}
            className="md:hidden"
            styles={{
              header: { borderBottom: '1px solid oklch(0.3 0 0)', paddingBottom: 16 },
              body: { backgroundColor: 'oklch(0.15 0 0)', padding: 0 },
            }}
            closeIcon={<CloseCircleOutlined className="text-gray-400 hover:text-gray-300" />}
          >
            <div className="p-4">
              <EarthquakeStats
                earthquakes={filteredEarthquakes}
                loading={loading}
                metadata={metadata}
              />
            </div>
          </Drawer>
        </Content>
      </Layout>
    </ConfigProvider>
  );
}

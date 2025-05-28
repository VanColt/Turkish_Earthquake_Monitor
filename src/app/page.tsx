'use client';

import { useEffect, useState, useCallback } from 'react';
import { ConfigProvider, theme, Layout, Row, Col, App, FloatButton, message, Modal, Button, Drawer } from 'antd';
import { Squares } from '@/components/ui/squares-background';
import { DownloadOutlined, QuestionCircleOutlined, HistoryOutlined, LineChartOutlined, SettingOutlined, CloseCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

// Components
import DashboardHeader from '@/components/DashboardHeader';
import EarthquakeMap from '@/components/EarthquakeMap';
import EarthquakeTable from '@/components/EarthquakeTable';
import EarthquakeStats from '@/components/EarthquakeStats';
import EarthquakeDetail from '@/components/EarthquakeDetail';

// Services
import {
  Earthquake,
  EarthquakeResponse,
  fetchLiveEarthquakes,
  fetchFilteredEarthquakes,
  fetchEarthquakeStats,
  exportToCSV,
  FilterParams
} from '@/services/earthquakeService';

const { Content } = Layout;
const { useToken } = theme;

export default function Home() {
  const { token } = useToken();
  const [messageApi, contextHolder] = message.useMessage();
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
  
  // Fetch earthquake data
  const fetchEarthquakes = useCallback(async () => {
    try {
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
      
      setEarthquakes(response.result);
      setFilteredEarthquakes(response.result);
      setMetadata(response.metadata);
      setLastUpdated(new Date());
      
      // Don't automatically select an earthquake on load
      // This ensures the map stays centered on Turkey
      
      messageApi.success(`Loaded ${response.result.length} earthquakes`);
    } catch (error) {
      console.error('Error fetching earthquake data:', error);
      messageApi.error('Failed to load earthquake data');
    } finally {
      setLoading(false);
    }
  }, [dateRange, magnitudeFilter, selectedEarthquake]);
  
  // Initial data fetch
  useEffect(() => {
    fetchEarthquakes();
    
    // Set up auto-refresh every 5 minutes
    const intervalId = setInterval(() => {
      fetchEarthquakes();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
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
      messageApi.warning('No data to export');
      return;
    }
    
    const csv = exportToCSV(filteredEarthquakes);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `kandilli_earthquakes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    messageApi.success('Data exported successfully');
  };
  
  // Show about modal
  const showAboutModal = () => {
    Modal.info({
      title: 'About Kandilli Earthquake Monitor',
      content: (
        <div>
          <p>This dashboard displays real-time earthquake data from the Kandilli Observatory and Earthquake Research Institute.</p>
          <p>Data is refreshed automatically every 5 minutes.</p>
          <p>API provided by: <a href="https://api.orhanaydogdu.com.tr/deprem/api-docs/" target="_blank" rel="noopener noreferrer">api.orhanaydogdu.com.tr</a></p>
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
      <App>
        {contextHolder}
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
            
            {/* Float buttons for mobile */}
            <FloatButton.Group
              trigger="click"
              className="md:hidden"
              icon={<SettingOutlined />}
              style={{ right: 24, bottom: 24 }}
              type="primary"
              badge={{ dot: true, color: 'oklch(0.2 0 0)' }}
            >
              <FloatButton
                icon={<LineChartOutlined />}
                tooltip={<span className="text-gray-100 bg-gray-800 px-2 py-1 rounded">View Statistics</span>}
                onClick={() => setStatsDrawerVisible(true)}
                type="primary"
              />
              <FloatButton
                icon={<DownloadOutlined />}
                tooltip={<span className="text-gray-100 bg-gray-800 px-2 py-1 rounded">Export Data</span>}
                onClick={handleExportData}
                type="primary"
              />
              <FloatButton
                icon={<QuestionCircleOutlined />}
                tooltip={<span className="text-gray-100 bg-gray-800 px-2 py-1 rounded">About</span>}
                onClick={showAboutModal}
                type="primary"
              />
            </FloatButton.Group>
          </Content>
        </Layout>
      </App>
    </ConfigProvider>
  );
}

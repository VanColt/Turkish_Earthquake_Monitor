'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ConfigProvider, theme, Layout, Modal, Drawer, Button } from 'antd';
import { CloseOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import DashboardHeader from '@/components/DashboardHeader';
import EarthquakeMap from '@/components/EarthquakeMap';
import EarthquakeTable from '@/components/EarthquakeTable';
import EarthquakeDetail from '@/components/EarthquakeDetail';
import EarthquakeStats from '@/components/EarthquakeStats';

import {
  Earthquake,
  EarthquakeResponse,
  fetchFilteredEarthquakes,
  fetchLiveEarthquakes,
  FilterParams,
} from '@/services/earthquakeService';

const { Content } = Layout;

function useNotification() {
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | null;
  }>({ message: '', type: null });

  const show = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: null }), 3000);
  };

  return {
    notification,
    showSuccess: (m: string) => show(m, 'success'),
    showError: (m: string) => show(m, 'error'),
  };
}

function getCurrentIntervalTime() {
  const now = new Date();
  now.setMinutes(Math.floor(now.getMinutes() / 5) * 5, 0, 0);
  return now;
}

function getNextRefreshTime() {
  const now = new Date();
  const next = new Date(now);
  next.setMinutes(Math.ceil(now.getMinutes() / 5) * 5, 0, 0);
  if (next <= now) next.setMinutes(next.getMinutes() + 5);
  return next;
}

export default function Home() {
  const { notification, showSuccess, showError } = useNotification();

  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [filtered, setFiltered] = useState<Earthquake[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selected, setSelected] = useState<Earthquake | null>(null);
  const [magnitudeFilter] = useState(0);
  const [dateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [metadata, setMetadata] = useState<EarthquakeResponse['metadata'] | null>(null);
  const [mobileDetailVisible, setMobileDetailVisible] = useState(false);
  const [statsDrawerVisible, setStatsDrawerVisible] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [nextRefreshTime, setNextRefreshTime] = useState<Date>(getNextRefreshTime());

  const lastFetchTimeRef = useRef<Date | null>(null);
  const earthquakesRef = useRef<Earthquake[]>([]);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastIngestedAtRef = useRef<number | null>(null);
  const changePollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchEarthquakes = useCallback(async () => {
    try {
      const currentInterval = getCurrentIntervalTime();
      const shouldFetch =
        !lastFetchTimeRef.current ||
        currentInterval.getTime() > lastFetchTimeRef.current.getTime() ||
        dateRange ||
        magnitudeFilter > 0;

      if (!shouldFetch) return;

      setLoading(true);
      let response: EarthquakeResponse;

      if (dateRange || magnitudeFilter > 0) {
        const params: FilterParams = {};
        if (magnitudeFilter > 0) params.min_mag = magnitudeFilter;
        if (dateRange && dateRange[0] && dateRange[1]) {
          params.start_date = dateRange[0].format('YYYY-MM-DD HH:mm:ss');
          params.end_date = dateRange[1].format('YYYY-MM-DD HH:mm:ss');
        }
        response = await fetchFilteredEarthquakes(params);
      } else {
        response = await fetchLiveEarthquakes();
      }

      let newLogs = 0;
      if (earthquakesRef.current.length > 0) {
        const existing = new Set(earthquakesRef.current.map((e) => e.earthquake_id));
        newLogs = response.result.filter((e) => !existing.has(e.earthquake_id)).length;
      }

      const hadData = !!lastFetchTimeRef.current;
      lastFetchTimeRef.current = currentInterval;
      earthquakesRef.current = response.result;

      setEarthquakes(response.result);
      setFiltered(response.result);
      setMetadata(response.metadata);
      setLastUpdated(currentInterval);

      if (hadData) {
        showSuccess(newLogs > 0 ? `${newLogs} new event${newLogs > 1 ? 's' : ''}` : 'Updated');
      }
    } catch (err) {
      console.error('fetchEarthquakes failed:', err);
      showError('Failed to load earthquake data');
    } finally {
      setLoading(false);
    }
  }, [dateRange, magnitudeFilter, showSuccess, showError]);

  useEffect(() => {
    fetchEarthquakes();

    const msUntilNext = getNextRefreshTime().getTime() - Date.now();
    refreshTimeoutRef.current = setTimeout(() => {
      fetchEarthquakes();
      setNextRefreshTime(getNextRefreshTime());
      refreshIntervalRef.current = setInterval(() => {
        fetchEarthquakes();
        setNextRefreshTime(getNextRefreshTime());
      }, 5 * 60 * 1000);
    }, msUntilNext);

    changePollRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/earthquakes/latest');
        if (!res.ok) return;
        const data = await res.json();
        const ingestedAt: number | null = data?.latest?.ingested_at ?? null;
        if (!ingestedAt) return;
        if (lastIngestedAtRef.current == null) {
          lastIngestedAtRef.current = ingestedAt;
          return;
        }
        if (ingestedAt > lastIngestedAtRef.current) {
          lastIngestedAtRef.current = ingestedAt;
          lastFetchTimeRef.current = null;
          fetchEarthquakes();
        }
      } catch {
        // Swallow — next tick will retry
      }
    }, 30_000);

    return () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
      if (changePollRef.current) clearInterval(changePollRef.current);
    };
  }, [fetchEarthquakes]);

  const handleSelect = (eq: Earthquake) => {
    setSelected(eq);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setMobileDetailVisible(true);
    }
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: 'oklch(0.78 0.16 85)',
          colorInfo: 'oklch(0.78 0.16 85)',
          borderRadius: 2,
          borderRadiusLG: 2,
          borderRadiusSM: 2,
          borderRadiusXS: 2,
          colorBgContainer: 'oklch(0.16 0 0)',
          colorBgElevated: 'oklch(0.20 0 0)',
          colorBgLayout: 'oklch(0.12 0 0)',
          colorText: 'oklch(0.95 0 0)',
          colorTextSecondary: 'oklch(0.70 0 0)',
          colorTextTertiary: 'oklch(0.50 0 0)',
          colorBorder: 'oklch(0.25 0 0)',
          colorBorderSecondary: 'oklch(0.20 0 0)',
          fontFamily: 'var(--font-inter), system-ui, sans-serif',
        },
        components: {
          Card: { headerBg: 'transparent', colorBorderSecondary: 'oklch(0.25 0 0)' },
          Table: { colorBgContainer: 'transparent', headerBg: 'oklch(0.16 0 0)' },
          Drawer: { colorBgElevated: 'oklch(0.16 0 0)' },
          Modal: { contentBg: 'oklch(0.16 0 0)' },
          Button: { primaryShadow: 'none', defaultShadow: 'none' },
        },
      }}
    >
      {notification.type && (
        <div
          className="fixed top-4 right-4 z-50 px-4 py-2 border mono text-[12px] shadow-lg"
          style={{
            background: 'var(--bg-1)',
            borderColor:
              notification.type === 'success' ? 'var(--accent)' : 'var(--mag-high)',
            color:
              notification.type === 'success' ? 'var(--accent)' : 'var(--mag-high)',
          }}
        >
          {notification.message}
        </div>
      )}

      <Layout className="min-h-screen" style={{ background: 'var(--bg-0)' }}>
        <Content className="p-4 md:p-6 max-w-[1920px] mx-auto">
          <div className="mb-4">
            <DashboardHeader
              loading={loading}
              lastUpdated={lastUpdated}
              nextRefreshTime={nextRefreshTime}
              onAbout={() => setAboutOpen(true)}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
            <div className="lg:col-span-8 h-[500px] md:h-[600px]">
              <EarthquakeMap
                earthquakes={filtered}
                loading={loading}
                selectedEarthquake={selected}
                onEarthquakeSelect={handleSelect}
              />
            </div>
            <div className="lg:col-span-4 hidden md:block h-[600px] p-4 border border-line bg-bg-1">
              <EarthquakeDetail earthquake={selected} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8">
              <EarthquakeTable
                earthquakes={filtered}
                loading={loading}
                onEarthquakeSelect={handleSelect}
                selectedEarthquake={selected}
              />
            </div>
            <div className="lg:col-span-4 hidden md:block p-4 border border-line bg-bg-1">
              <EarthquakeStats
                earthquakes={filtered}
                loading={loading}
                metadata={metadata}
              />
            </div>
          </div>

          <Drawer
            title={<span className="mono text-[11px] uppercase tracking-[0.1em] text-fg-2">Event Detail</span>}
            placement="bottom"
            height="80vh"
            open={mobileDetailVisible}
            onClose={() => setMobileDetailVisible(false)}
            className="md:hidden"
            styles={{
              header: { borderBottom: '1px solid var(--line)', padding: 12 },
              body: { background: 'var(--bg-1)', padding: 16 },
            }}
            closeIcon={<CloseOutlined className="text-fg-2" />}
          >
            <EarthquakeDetail earthquake={selected} />
          </Drawer>

          <Drawer
            title={<span className="mono text-[11px] uppercase tracking-[0.1em] text-fg-2">Statistics</span>}
            placement="right"
            width="90vw"
            open={statsDrawerVisible}
            onClose={() => setStatsDrawerVisible(false)}
            className="md:hidden"
            styles={{
              header: { borderBottom: '1px solid var(--line)', padding: 12 },
              body: { background: 'var(--bg-1)', padding: 16 },
            }}
            closeIcon={<CloseOutlined className="text-fg-2" />}
          >
            <EarthquakeStats earthquakes={filtered} loading={loading} metadata={metadata} />
          </Drawer>

          <Modal
            title={<span className="mono text-[11px] uppercase tracking-[0.1em] text-fg-2">About</span>}
            open={aboutOpen}
            onCancel={() => setAboutOpen(false)}
            footer={null}
            width={480}
          >
            <div className="text-[13px] text-fg-1 leading-relaxed">
              <p>
                Real-time earthquake data for Turkey, sourced from the{' '}
                <span className="text-fg-0">Kandilli Observatory and Earthquake Research Institute</span>{' '}
                (Boğaziçi University).
              </p>
              <p className="mt-3">
                Data is fetched on a 5-minute schedule and stored in our own database. The map and
                feed update automatically when new events are ingested.
              </p>
              <p className="mt-3 mono text-[11px] text-fg-2">
                Built by <a className="text-accent" href="https://github.com/VanColt">@VanColt</a>
                {' · '}
                <a className="text-accent" href="https://github.com/VanColt/Turkish_Earthquake_Monitor">
                  Source
                </a>
              </p>
            </div>
          </Modal>
        </Content>
      </Layout>
    </ConfigProvider>
  );
}

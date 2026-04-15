'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ConfigProvider, theme, Modal } from 'antd';

import TopBar from '@/components/TopBar';
import EventFeed from '@/components/EventFeed';
import EventInspector from '@/components/EventInspector';
import StatusBar from '@/components/StatusBar';

import {
  Earthquake,
  EarthquakeResponse,
  fetchLiveEarthquakes,
} from '@/services/earthquakeService';

const Globe = dynamic(() => import('@/components/Globe'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center text-ink-2 mono text-[11px]">
      INITIALIZING ORBIT…
    </div>
  ),
});

function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const show = useCallback((m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 2400);
  }, []);
  return { msg, show };
}

export default function Home() {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [selected, setSelected] = useState<Earthquake | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [metadata, setMetadata] = useState<EarthquakeResponse['metadata'] | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [feedVisible, setFeedVisible] = useState(true);
  const { msg, show } = useToast();

  const lastIngestedRef = useRef<number | null>(null);
  const earthquakesRef = useRef<Earthquake[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchLiveEarthquakes();
      const prevIds = new Set(earthquakesRef.current.map((e) => e.earthquake_id));
      const newCount = res.result.filter((e) => !prevIds.has(e.earthquake_id)).length;

      earthquakesRef.current = res.result;
      setEarthquakes(res.result);
      setMetadata(res.metadata);
      setLastUpdated(new Date());

      if (prevIds.size > 0 && newCount > 0) {
        show(`+${newCount} new event${newCount > 1 ? 's' : ''}`);
      }
    } catch (err) {
      console.error('load failed', err);
      show('sync failed');
    } finally {
      setLoading(false);
    }
  }, [show]);

  useEffect(() => {
    load();
    const full = setInterval(load, 5 * 60 * 1000);
    const poll = setInterval(async () => {
      try {
        const res = await fetch('/api/earthquakes/latest');
        if (!res.ok) return;
        const data = await res.json();
        const ingestedAt: number | null = data?.latest?.ingested_at ?? null;
        if (!ingestedAt) return;
        if (lastIngestedRef.current == null) {
          lastIngestedRef.current = ingestedAt;
          return;
        }
        if (ingestedAt > lastIngestedRef.current) {
          lastIngestedRef.current = ingestedAt;
          load();
        }
      } catch {
        // no-op
      }
    }, 30_000);
    return () => {
      clearInterval(full);
      clearInterval(poll);
    };
  }, [load]);

  // Keyboard shortcuts: ESC closes inspector, F toggles feed
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
      if (e.key === 'f' || e.key === 'F') setFeedVisible((v) => !v);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: 'oklch(0.84 0.18 80)',
          borderRadius: 0,
          borderRadiusLG: 0,
          borderRadiusSM: 0,
          colorBgElevated: 'var(--panel)',
          colorBgContainer: 'var(--panel)',
          colorText: 'var(--ink)',
          colorTextSecondary: 'var(--ink-1)',
          colorBorder: 'var(--line)',
          fontFamily: 'var(--font-display), sans-serif',
        },
      }}
    >
      <div className="fixed inset-0 overflow-hidden" style={{ background: 'var(--void)' }}>
        {/* Globe — full bleed */}
        <Globe earthquakes={earthquakes} selected={selected} onSelect={setSelected} />

        {/* Reticles on the viewport corners */}
        <span className="reticle tl" style={{ top: 12, left: 12 }} />
        <span className="reticle tr" style={{ top: 12, right: 12 }} />
        <span className="reticle bl" style={{ bottom: 12, left: 12 }} />
        <span className="reticle br" style={{ bottom: 12, right: 12 }} />

        {/* Top bar */}
        <TopBar
          loading={loading}
          eventCount={metadata?.count ?? earthquakes.length}
          onAbout={() => setAboutOpen(true)}
        />

        {/* Left rail — event feed */}
        {feedVisible && (
          <div className="absolute left-4 top-24 bottom-20 z-20 w-[340px] hidden md:flex">
            <EventFeed
              earthquakes={earthquakes}
              selected={selected}
              onSelect={setSelected}
            />
          </div>
        )}

        {/* Right rail — inspector */}
        {selected && (
          <div className="absolute right-4 top-24 bottom-20 z-20 w-[380px] hidden md:flex flex-col">
            <EventInspector earthquake={selected} onClose={() => setSelected(null)} />
          </div>
        )}

        {/* Status bar */}
        <StatusBar earthquakes={earthquakes} lastUpdated={lastUpdated} />

        {/* Feed toggle button (visible when feed is hidden, desktop only) */}
        {!feedVisible && (
          <button
            onClick={() => setFeedVisible(true)}
            className="hidden md:block absolute left-4 top-1/2 -translate-y-1/2 z-20 glass px-2 py-4 display tracked text-[10px] text-ink-1 hover:text-sig"
            title="Show feed (F)"
          >
            FEED
          </button>
        )}

        {/* Toast */}
        {msg && (
          <div
            className="absolute top-20 left-1/2 -translate-x-1/2 z-40 glass-strong px-4 py-2 mono text-[11px]"
            style={{ color: 'var(--sig)' }}
          >
            {msg}
          </div>
        )}

        {/* Mobile inspector as bottom sheet */}
        {selected && (
          <div
            className="md:hidden absolute left-0 right-0 bottom-20 z-30 max-h-[60vh] overflow-hidden"
            style={{ margin: 8 }}
          >
            <EventInspector earthquake={selected} onClose={() => setSelected(null)} />
          </div>
        )}

        {/* About modal */}
        <Modal
          title="MISSION BRIEF"
          open={aboutOpen}
          onCancel={() => setAboutOpen(false)}
          footer={null}
          width={520}
        >
          <div className="text-[13px] text-ink-1 leading-relaxed mono">
            <p className="text-ink">
              Live seismic telemetry for Türkiye — events sourced from the{' '}
              <span className="text-sig">
                Kandilli Observatory and Earthquake Research Institute
              </span>{' '}
              at Boğaziçi University.
            </p>
            <p className="mt-3">
              Data is polled every 5 minutes and persisted to our own store. The globe and
              feed update in near-real-time via a lightweight change detector.
            </p>
            <div className="mt-4 pt-3 border-t border-line">
              <div className="display tracked text-[10px] text-ink-3 mb-2">CONTROLS</div>
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px]">
                <span className="text-sig">ESC</span><span>Close inspector</span>
                <span className="text-sig">F</span><span>Toggle event feed</span>
                <span className="text-sig">SCROLL</span><span>Zoom globe</span>
                <span className="text-sig">DRAG</span><span>Rotate globe</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-line display tracked text-[10px] text-ink-3">
              BUILT BY{' '}
              <a className="text-sig" href="https://github.com/VanColt">
                @VanColt
              </a>{' '}
              ·{' '}
              <a
                className="text-sig"
                href="https://github.com/VanColt/Turkish_Earthquake_Monitor"
              >
                SOURCE
              </a>
            </div>
          </div>
        </Modal>
      </div>
    </ConfigProvider>
  );
}

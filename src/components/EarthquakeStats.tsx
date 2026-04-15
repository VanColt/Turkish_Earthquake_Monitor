'use client';

import React from 'react';
import { Earthquake } from '@/services/earthquakeService';
import { MagnitudeBadge } from './ui/MagnitudeBadge';
import { magnitudeVar, relativeTime } from '@/lib/magnitude';

interface EarthquakeStatsProps {
  earthquakes: Earthquake[];
  loading: boolean;
  metadata: {
    date_starts: string;
    date_ends: string;
    count: number;
  } | null;
}

interface Stats {
  total: number;
  avgMag: number;
  avgDepth: number;
  ranges: { minor: number; light: number; moderate: number; strong: number; major: number };
  strongest: Earthquake;
  mostRecent: Earthquake;
}

function computeStats(earthquakes: Earthquake[]): Stats | null {
  if (!earthquakes.length) return null;
  const total = earthquakes.length;
  const avgMag = earthquakes.reduce((s, e) => s + e.mag, 0) / total;
  const avgDepth = earthquakes.reduce((s, e) => s + e.depth, 0) / total;
  const ranges = {
    minor: earthquakes.filter((e) => e.mag < 3).length,
    light: earthquakes.filter((e) => e.mag >= 3 && e.mag < 4).length,
    moderate: earthquakes.filter((e) => e.mag >= 4 && e.mag < 5).length,
    strong: earthquakes.filter((e) => e.mag >= 5 && e.mag < 6).length,
    major: earthquakes.filter((e) => e.mag >= 6).length,
  };
  const strongest = earthquakes.reduce((m, e) => (e.mag > m.mag ? e : m), earthquakes[0]);
  const mostRecent = earthquakes.reduce(
    (m, e) => (new Date(e.date_time).getTime() > new Date(m.date_time).getTime() ? e : m),
    earthquakes[0]
  );
  return { total, avgMag, avgDepth, ranges, strongest, mostRecent };
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-[0.08em] text-fg-2">{children}</div>
  );
}

function StatTile({
  label,
  value,
  suffix,
  emphasize,
}: {
  label: string;
  value: string;
  suffix?: string;
  emphasize?: boolean;
}) {
  return (
    <div className="border border-line bg-bg-1 px-3 py-2.5">
      <Label>{label}</Label>
      <div
        className="mono mt-1 tabular-nums"
        style={{
          fontSize: 22,
          color: emphasize ? 'var(--accent)' : 'var(--fg-0)',
          lineHeight: 1.1,
        }}
      >
        {value}
        {suffix && <span className="ml-1 text-fg-2" style={{ fontSize: 12 }}>{suffix}</span>}
      </div>
    </div>
  );
}

function StackedMagBar({ ranges, total }: { ranges: Stats['ranges']; total: number }) {
  const segments = [
    { key: 'minor', label: '< 3.0', count: ranges.minor, mag: 2 },
    { key: 'light', label: '3.0–3.9', count: ranges.light, mag: 3.5 },
    { key: 'moderate', label: '4.0–4.9', count: ranges.moderate, mag: 4.5 },
    { key: 'strong', label: '5.0–5.9', count: ranges.strong, mag: 5.5 },
    { key: 'major', label: '≥ 6.0', count: ranges.major, mag: 6.5 },
  ];
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label>Magnitude distribution</Label>
        <span className="mono text-[10px] text-fg-2">N={total}</span>
      </div>
      <div className="flex h-2 overflow-hidden border border-line">
        {segments.map((s) => {
          const pct = total ? (s.count / total) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div
              key={s.key}
              style={{ width: `${pct}%`, background: magnitudeVar(s.mag) }}
              title={`${s.label} — ${s.count}`}
            />
          );
        })}
      </div>
      <div className="mt-2 grid grid-cols-5 gap-1">
        {segments.map((s) => (
          <div key={s.key} className="flex flex-col items-start gap-0.5">
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block"
                style={{ width: 6, height: 6, background: magnitudeVar(s.mag) }}
              />
              <span className="mono text-[10px] text-fg-1">{s.label}</span>
            </div>
            <span className="mono tabular-nums text-[11px] text-fg-0">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LogEntry({ tag, eq }: { tag: string; eq: Earthquake }) {
  return (
    <div className="flex items-start gap-3 border-t border-line py-2">
      <div className="w-20 shrink-0">
        <Label>{tag}</Label>
        <div className="mono text-[10px] text-fg-2 mt-0.5">{relativeTime(eq.date_time)}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <MagnitudeBadge mag={eq.mag} />
          <span className="text-[12px] text-fg-0 truncate">{eq.title}</span>
        </div>
        <div className="mono text-[10px] text-fg-2 mt-0.5 truncate">
          {eq.location_properties?.closestCity?.name ?? '—'} ·{' '}
          {eq.depth.toFixed(1)} km
        </div>
      </div>
    </div>
  );
}

const EarthquakeStats: React.FC<EarthquakeStatsProps> = ({
  earthquakes,
  loading,
  metadata,
}) => {
  const stats = computeStats(earthquakes);

  if (loading && !stats) {
    return <div className="mono text-[11px] text-fg-2">Loading statistics…</div>;
  }
  if (!stats) {
    return <div className="mono text-[11px] text-fg-2">No earthquake data.</div>;
  }

  const more = metadata ? Math.max(0, metadata.count - stats.total) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="mono text-[10px] uppercase tracking-[0.1em] text-fg-2">
          Statistical Analysis
        </div>
        {more > 0 && (
          <span className="mono text-[10px] text-fg-2">+{more} in full dataset</span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatTile label="Total" value={stats.total.toString()} />
        <StatTile
          label="Avg Mag"
          value={stats.avgMag.toFixed(2)}
          emphasize={stats.avgMag >= 4}
        />
        <StatTile label="Avg Depth" value={stats.avgDepth.toFixed(1)} suffix="km" />
      </div>

      <StackedMagBar ranges={stats.ranges} total={stats.total} />

      <div>
        <LogEntry tag="Strongest" eq={stats.strongest} />
        <LogEntry tag="Most recent" eq={stats.mostRecent} />
      </div>
    </div>
  );
};

export default EarthquakeStats;

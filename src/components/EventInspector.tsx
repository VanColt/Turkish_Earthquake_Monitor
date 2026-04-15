'use client';

import type { Earthquake } from '@/services/earthquakeService';
import { relativeTime, magnitudeLabel, magnitudeTier } from '@/lib/magnitude';

interface EventInspectorProps {
  earthquake: Earthquake | null;
  onClose: () => void;
}

const TIER_COLOR: Record<string, string> = {
  low: 'var(--mag-low)',
  mid: 'var(--mag-mid)',
  high: 'var(--mag-high)',
  max: 'var(--mag-max)',
};

export default function EventInspector({ earthquake, onClose }: EventInspectorProps) {
  if (!earthquake) return null;

  const tier = magnitudeTier(earthquake.mag);
  const color = TIER_COLOR[tier];
  const [lng, lat] = earthquake.geojson.coordinates;
  const cities = earthquake.location_properties?.closestCities?.slice(0, 3) ?? [];
  const airports = earthquake.location_properties?.airports?.slice(0, 2) ?? [];
  const maxKm = cities.length ? Math.max(...cities.map((c) => c.distance / 1000)) : 100;

  return (
    <div className="glass-strong slide-right-in flex flex-col h-full relative">
      <span className="reticle tl" />
      <span className="reticle tr" />
      <span className="reticle bl" />
      <span className="reticle br" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="display tracked text-[10px] text-sig">INSPECTOR</span>
          <span className="mono text-[10px] text-ink-3">{earthquake.earthquake_id}</span>
        </div>
        <button
          onClick={onClose}
          className="display tracked text-[10px] text-ink-2 hover:text-sig px-1.5 py-0.5 border border-line hover:border-sig transition-colors"
          aria-label="Close inspector"
        >
          CLOSE
        </button>
      </div>

      {/* Hero */}
      <div className="flex items-start gap-4 px-4 py-4 border-b border-line">
        <div className="flex flex-col items-start">
          <div
            className="mono tabular-nums leading-none"
            style={{ color, fontSize: 56, fontWeight: 500 }}
          >
            {earthquake.mag.toFixed(1)}
          </div>
          <div className="display tracked text-[9px] mt-1" style={{ color }}>
            {magnitudeLabel(earthquake.mag).toUpperCase()}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="display tracked text-[9px] text-ink-3">EPICENTER</div>
          <div className="text-[14px] text-ink mt-1 break-words">{earthquake.title}</div>
          <div className="mono text-[10px] text-ink-2 mt-2">
            {relativeTime(earthquake.date_time)}
          </div>
          <div className="mono text-[10px] text-ink-3">{earthquake.date_time}</div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* Telemetry grid */}
        <div className="grid grid-cols-2 gap-px bg-line">
          <Field label="Depth" value={`${earthquake.depth.toFixed(1)} km`} />
          <Field
            label="Coord"
            value={`${lat.toFixed(4)}, ${lng.toFixed(4)}`}
            small
          />
          <Field
            label="Region"
            value={earthquake.location_properties?.epiCenter?.name ?? '—'}
          />
          <Field label="TZ" value={earthquake.location_tz ?? '—'} small />
        </div>

        {/* Closest cities */}
        {cities.length > 0 && (
          <div className="px-4 py-4 border-t border-line">
            <div className="display tracked text-[9px] text-ink-3 mb-3">PROXIMAL CITIES</div>
            <div className="flex flex-col gap-2">
              {cities.map((c) => {
                const km = c.distance / 1000;
                const pct = Math.max(6, Math.min(100, (km / maxKm) * 100));
                return (
                  <div key={c.cityCode} className="flex items-center gap-3">
                    <span className="w-24 text-[11px] text-ink truncate">{c.name}</span>
                    <div className="flex-1 h-[3px]" style={{ background: 'var(--panel-2)' }}>
                      <div
                        className="h-full"
                        style={{ width: `${pct}%`, background: 'var(--ink-3)' }}
                      />
                    </div>
                    <span className="mono tabular-nums text-[10px] text-ink-1 w-16 text-right">
                      {km.toFixed(1)} km
                    </span>
                    <span className="mono tabular-nums text-[10px] text-ink-3 w-12 text-right">
                      {c.population >= 1_000_000
                        ? `${(c.population / 1_000_000).toFixed(1)}M`
                        : `${Math.round(c.population / 1000)}K`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Airports */}
        {airports.length > 0 && (
          <div className="px-4 py-4 border-t border-line">
            <div className="display tracked text-[9px] text-ink-3 mb-3">NEAREST AIRPORTS</div>
            <div className="flex flex-col gap-2">
              {airports.map((a) => (
                <div key={a.code} className="flex items-center gap-3">
                  <span
                    className="mono text-[10px] px-1.5 py-0.5 border"
                    style={{ borderColor: 'var(--line-strong)', color: 'var(--sig)' }}
                  >
                    {a.code}
                  </span>
                  <span className="flex-1 text-[11px] text-ink truncate">{a.name}</span>
                  <span className="mono tabular-nums text-[10px] text-ink-2">
                    {(a.distance / 1000).toFixed(1)} km
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="bg-panel px-4 py-3">
      <div className="display tracked text-[9px] text-ink-3">{label.toUpperCase()}</div>
      <div
        className={`mono mt-1 tabular-nums text-ink ${
          small ? 'text-[11px]' : 'text-[14px]'
        }`}
      >
        {value}
      </div>
    </div>
  );
}

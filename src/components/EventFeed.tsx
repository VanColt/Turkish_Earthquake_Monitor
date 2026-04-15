'use client';

import { useMemo, useState } from 'react';
import type { Earthquake } from '@/services/earthquakeService';
import { relativeTime, magnitudeTier } from '@/lib/magnitude';

interface EventFeedProps {
  earthquakes: Earthquake[];
  selected: Earthquake | null;
  onSelect: (eq: Earthquake) => void;
}

const TIER_COLOR: Record<string, string> = {
  low: 'var(--mag-low)',
  mid: 'var(--mag-mid)',
  high: 'var(--mag-high)',
  max: 'var(--mag-max)',
};

type Sort = 'recent' | 'magnitude';

export default function EventFeed({ earthquakes, selected, onSelect }: EventFeedProps) {
  const [sort, setSort] = useState<Sort>('recent');
  const [minMag, setMinMag] = useState(0);

  const sorted = useMemo(() => {
    const filtered = minMag > 0 ? earthquakes.filter((e) => e.mag >= minMag) : earthquakes;
    const arr = [...filtered];
    if (sort === 'recent') {
      arr.sort(
        (a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime()
      );
    } else {
      arr.sort((a, b) => b.mag - a.mag);
    }
    return arr;
  }, [earthquakes, sort, minMag]);

  return (
    <div className="flex flex-col h-full glass-strong relative">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-1 h-1 rounded-full sig-pulse"
            style={{ background: 'var(--sig)' }}
          />
          <span className="display tracked text-[10px] text-ink">EVENT FEED</span>
        </div>
        <span className="mono text-[10px] text-ink-2">{sorted.length}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        <div className="flex">
          {(['recent', 'magnitude'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`display tracked text-[9px] px-2 py-1 border ${
                sort === s
                  ? 'text-sig border-sig-dim'
                  : 'text-ink-2 border-line hover:text-ink-1'
              } -ml-px first:ml-0`}
              style={{ background: sort === s ? 'color-mix(in oklab, var(--sig) 10%, transparent)' : 'transparent' }}
            >
              {s === 'recent' ? 'RECENT' : 'MAG'}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          <span className="display tracked text-[9px] text-ink-3">MIN</span>
          {[0, 3, 4, 5].map((m) => (
            <button
              key={m}
              onClick={() => setMinMag(m)}
              className={`mono text-[10px] px-1.5 py-0.5 border ${
                minMag === m ? 'text-sig border-sig-dim' : 'text-ink-2 border-line'
              } -ml-px first:ml-0`}
            >
              {m === 0 ? 'ALL' : m.toFixed(0)}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 && (
          <div className="mono text-[11px] text-ink-2 p-6 text-center">No events match filter</div>
        )}
        {sorted.map((eq, idx) => {
          const tier = magnitudeTier(eq.mag);
          const active = selected?.earthquake_id === eq.earthquake_id;
          return (
            <button
              key={eq.earthquake_id}
              onClick={() => onSelect(eq)}
              className="w-full text-left group relative flex items-center gap-3 px-3 py-2.5 border-b border-line hover:bg-panel-2 transition-colors fade-up"
              style={{
                animationDelay: `${Math.min(idx * 12, 300)}ms`,
                background: active ? 'color-mix(in oklab, var(--sig) 10%, transparent)' : undefined,
              }}
            >
              {active && (
                <span
                  className="absolute left-0 top-0 bottom-0 w-[2px]"
                  style={{ background: 'var(--sig)' }}
                />
              )}
              {/* Magnitude hero */}
              <div
                className="mono tabular-nums text-[22px] leading-none w-14 text-right shrink-0"
                style={{ color: TIER_COLOR[tier] }}
              >
                {eq.mag.toFixed(1)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-[12px] text-ink truncate">{eq.title}</div>
                <div className="mono text-[10px] text-ink-2 mt-0.5 flex items-center gap-2">
                  <span>{relativeTime(eq.date_time)}</span>
                  <span className="text-ink-3">·</span>
                  <span>{eq.depth.toFixed(1)} km</span>
                  {eq.location_properties?.closestCity?.name && (
                    <>
                      <span className="text-ink-3">·</span>
                      <span className="truncate">
                        {eq.location_properties.closestCity.name}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

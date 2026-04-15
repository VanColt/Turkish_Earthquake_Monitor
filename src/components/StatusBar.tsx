'use client';

import type { Earthquake } from '@/services/earthquakeService';
import { magnitudeTier } from '@/lib/magnitude';

interface StatusBarProps {
  earthquakes: Earthquake[];
  lastUpdated: Date | null;
}

const TIER_COLOR: Record<string, string> = {
  low: 'var(--mag-low)',
  mid: 'var(--mag-mid)',
  high: 'var(--mag-high)',
  max: 'var(--mag-max)',
};

export default function StatusBar({ earthquakes, lastUpdated }: StatusBarProps) {
  const buckets = { low: 0, mid: 0, high: 0, max: 0 };
  for (const e of earthquakes) buckets[magnitudeTier(e.mag)]++;
  const maxMag = earthquakes.reduce((m, e) => (e.mag > m ? e.mag : m), 0);

  return (
    <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-30 p-4">
      <div className="glass pointer-events-auto flex items-center justify-between px-4 py-2 relative overflow-hidden">
        <div className="scanline absolute inset-0 opacity-40" />
        {/* Left: source */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="display tracked text-[9px] text-ink-3">SOURCE</span>
            <span className="mono text-[10px] text-ink-1">B.U. KANDILLI OBS.</span>
          </div>
          <div className="h-4 w-px bg-line" />
          <div className="flex items-center gap-2">
            <span className="display tracked text-[9px] text-ink-3">CYCLE</span>
            <span className="mono text-[10px] text-ink-1">5 MIN</span>
          </div>
          {lastUpdated && (
            <>
              <div className="h-4 w-px bg-line" />
              <div className="flex items-center gap-2">
                <span className="display tracked text-[9px] text-ink-3">SYNC</span>
                <span className="mono text-[10px] text-ink-1">
                  {lastUpdated.toLocaleTimeString(undefined, { hour12: false })}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Center: magnitude legend */}
        <div className="hidden lg:flex items-center gap-4">
          {(['low', 'mid', 'high', 'max'] as const).map((t) => (
            <div key={t} className="flex items-center gap-1.5">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: TIER_COLOR[t] }}
              />
              <span className="display tracked text-[9px] text-ink-2">
                {t === 'low' ? '<3' : t === 'mid' ? '3–4.9' : t === 'high' ? '5–5.9' : '≥6'}
              </span>
              <span className="mono text-[10px] text-ink-1 tabular-nums">{buckets[t]}</span>
            </div>
          ))}
        </div>

        {/* Right: peak */}
        <div className="flex items-center gap-2">
          <span className="display tracked text-[9px] text-ink-3">PEAK</span>
          <span className="mono tabular-nums text-[12px]" style={{ color: 'var(--sig)' }}>
            M{maxMag.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
}

'use client';

import { AdminLevel } from '@/lib/settings';

interface Props {
  value: AdminLevel;
  onChange: (next: AdminLevel) => void;
}

const OPTIONS: { value: AdminLevel; label: string; sub: string }[] = [
  { value: 'off', label: 'OFF', sub: '—' },
  { value: 'regions', label: 'REGION', sub: '7' },
  { value: 'provinces', label: 'PROVINCE', sub: '81' },
  { value: 'districts', label: 'DISTRICT', sub: '973' },
];

/**
 * Segmented on-map control for switching admin-boundary overlay level.
 * Pinned bottom-center, always visible, one-click switching — the intent is
 * "you never have to open settings to change this". Each option shows its
 * feature count (OFF / 7 / 81 / 973) so users understand the granularity.
 */
export default function AdminLevelSwitch({ value, onChange }: Props) {
  return (
    <div className="pointer-events-auto glass flex items-stretch">
      {OPTIONS.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            title={
              o.value === 'off'
                ? 'No administrative overlay'
                : `${o.label.toLowerCase()} · ${o.sub} features`
            }
            className={`group px-3 py-1.5 border-r border-line last:border-r-0 transition-colors flex flex-col items-center gap-0.5 min-w-[72px] ${
              active ? 'text-sig' : 'text-ink-2 hover:text-ink-1'
            }`}
            style={{
              background: active
                ? 'color-mix(in oklab, var(--sig) 12%, transparent)'
                : 'transparent',
            }}
          >
            <span className="display tracked text-[10px] leading-none">{o.label}</span>
            <span
              className={`mono tabular-nums text-[10px] leading-none ${
                active ? 'text-sig' : 'text-ink-3'
              }`}
            >
              {o.sub}
            </span>
          </button>
        );
      })}
    </div>
  );
}

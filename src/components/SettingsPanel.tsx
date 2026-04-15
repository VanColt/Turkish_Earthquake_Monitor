'use client';

import { Settings, ViewMode, DEFAULT_SETTINGS } from '@/lib/settings';

interface SettingsPanelProps {
  settings: Settings;
  onChange: (next: Settings) => void;
}

export default function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  const update = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    onChange({ ...settings, [key]: value });

  return (
    <div className="flex flex-col gap-5">
      {/* View mode */}
      <Section
        label="View mode"
        help="MARKERS: individual events. HEATMAP: estimated felt-shaking zones — radius scales with magnitude (M5 ≈ 150 km felt-radius), and overlapping clusters merge into hotter regions. BOTH stacks them."
      >
        <Segmented
          value={settings.viewMode}
          options={[
            { value: 'markers', label: 'MARKERS' },
            { value: 'heatmap', label: 'HEATMAP' },
            { value: 'both', label: 'BOTH' },
          ]}
          onChange={(v) => update('viewMode', v as ViewMode)}
        />
      </Section>

      {/* Magnitude filter */}
      <Section
        label="Magnitude filter"
        help="Hide events below this magnitude. Applies to map and feed."
      >
        <Segmented
          value={String(settings.minMagnitude)}
          options={[
            { value: '0', label: 'ALL' },
            { value: '2', label: '≥ 2' },
            { value: '3', label: '≥ 3' },
            { value: '4', label: '≥ 4' },
            { value: '5', label: '≥ 5' },
          ]}
          onChange={(v) => update('minMagnitude', Number(v))}
        />
      </Section>

      {/* Map detail toggles */}
      <Section label="Map details">
        <Toggle
          label="City labels"
          on={settings.showLabels}
          onChange={(on) => update('showLabels', on)}
        />
        <Toggle
          label="Highways"
          on={settings.showHighways}
          onChange={(on) => update('showHighways', on)}
        />
        <Toggle
          label="Province lines"
          on={settings.showProvinces}
          onChange={(on) => update('showProvinces', on)}
        />
      </Section>

      {/* Geological overlays */}
      <Section
        label="Geology"
        help="Active fault lines from the GEM Global Active Faults Database (NAF and EAF visible across Türkiye)."
      >
        <Toggle
          label="Active fault lines"
          on={settings.showFaults}
          onChange={(on) => update('showFaults', on)}
        />
      </Section>

      {/* Reset */}
      <button
        onClick={() => onChange(DEFAULT_SETTINGS)}
        className="self-start display tracked text-[10px] text-ink-3 hover:text-sig px-2 py-1 border border-line hover:border-sig transition-colors"
      >
        RESET DEFAULTS
      </button>
    </div>
  );
}

function Section({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 pb-4 border-b border-line last:border-b-0">
      <div className="flex flex-col gap-0.5">
        <div className="display tracked text-[10px] text-ink uppercase">{label}</div>
        {help && <div className="mono text-[10px] text-ink-3">{help}</div>}
      </div>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`display tracked text-[10px] px-2.5 py-1.5 border -ml-px first:ml-0 transition-colors ${
              active
                ? 'text-sig border-sig-dim'
                : 'text-ink-2 border-line hover:text-ink-1 hover:border-line-strong'
            }`}
            style={{
              background: active
                ? 'color-mix(in oklab, var(--sig) 10%, transparent)'
                : 'transparent',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="flex items-center justify-between py-1.5 group"
      type="button"
    >
      <span className="text-[12px] text-ink-1 group-hover:text-ink">{label}</span>
      <span
        className={`relative inline-flex items-center w-9 h-4 border transition-colors ${
          on ? 'border-sig-dim' : 'border-line group-hover:border-line-strong'
        }`}
        style={{
          background: on ? 'color-mix(in oklab, var(--sig) 18%, transparent)' : 'transparent',
        }}
      >
        <span
          className="absolute top-0.5 w-3 h-3 transition-all"
          style={{
            left: on ? '20px' : '2px',
            background: on ? 'var(--sig)' : 'var(--ink-2)',
          }}
        />
      </span>
    </button>
  );
}

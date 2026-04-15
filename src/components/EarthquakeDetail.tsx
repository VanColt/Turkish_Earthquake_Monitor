'use client';

import React from 'react';
import { Earthquake } from '@/services/earthquakeService';
import { magnitudeVar, magnitudeLabel, relativeTime } from '@/lib/magnitude';

interface EarthquakeDetailProps {
  earthquake: Earthquake | null;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="mono text-[10px] uppercase tracking-[0.1em] text-fg-2">{children}</div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line pt-2">
      <Label>{label}</Label>
      <div className="mt-1 text-[12px] text-fg-0">{children}</div>
    </div>
  );
}

function CityBar({
  name,
  distanceKm,
  population,
  maxKm,
}: {
  name: string;
  distanceKm: number;
  population: number;
  maxKm: number;
}) {
  const pct = Math.max(4, Math.min(100, (distanceKm / maxKm) * 100));
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-24 truncate text-[12px] text-fg-0">{name}</span>
      <div className="flex-1 h-1 bg-bg-2">
        <div className="h-full" style={{ width: `${pct}%`, background: 'var(--fg-3)' }} />
      </div>
      <span className="mono tabular-nums text-[10px] text-fg-1 w-20 text-right">
        {distanceKm.toFixed(1)} km
      </span>
      <span className="mono tabular-nums text-[10px] text-fg-2 w-14 text-right">
        {population >= 1_000_000
          ? `${(population / 1_000_000).toFixed(1)}M`
          : `${Math.round(population / 1000)}K`}
      </span>
    </div>
  );
}

const EarthquakeDetail: React.FC<EarthquakeDetailProps> = ({ earthquake }) => {
  if (!earthquake) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="mono text-[11px] text-fg-2 text-center">
          <div>No event selected</div>
          <div className="mt-1 text-[10px] text-fg-3">Click a marker or a row to inspect</div>
        </div>
      </div>
    );
  }

  const [lng, lat] = earthquake.geojson.coordinates;
  const cities = earthquake.location_properties?.closestCities?.slice(0, 3) ?? [];
  const airports = earthquake.location_properties?.airports?.slice(0, 2) ?? [];
  const maxKm = cities.length
    ? Math.max(...cities.map((c) => c.distance / 1000))
    : 100;

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto pr-1">
      {/* Hero */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Label>Event</Label>
          <div className="text-[13px] text-fg-0 mt-1 break-words">{earthquake.title}</div>
          <div className="mono text-[10px] text-fg-2 mt-1">
            {relativeTime(earthquake.date_time)} · {earthquake.date_time}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div
            className="mono tabular-nums leading-none"
            style={{ color: magnitudeVar(earthquake.mag), fontSize: 40, fontWeight: 500 }}
          >
            {earthquake.mag.toFixed(1)}
          </div>
          <div
            className="mono text-[10px] uppercase tracking-[0.1em] mt-1"
            style={{ color: magnitudeVar(earthquake.mag) }}
          >
            {magnitudeLabel(earthquake.mag)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Depth">
          <span className="mono tabular-nums">
            {earthquake.depth.toFixed(1)}
            <span className="text-fg-2"> km</span>
          </span>
        </Field>
        <Field label="Coordinates">
          <span className="mono tabular-nums text-[11px]">
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </span>
        </Field>
        <Field label="Epicenter">
          <span>{earthquake.location_properties?.epiCenter?.name ?? '—'}</span>
        </Field>
        <Field label="Timezone">
          <span className="mono text-[11px]">{earthquake.location_tz ?? '—'}</span>
        </Field>
      </div>

      {cities.length > 0 && (
        <div>
          <Label>Closest cities</Label>
          <div className="mt-2">
            {cities.map((c) => (
              <CityBar
                key={c.cityCode}
                name={c.name}
                distanceKm={c.distance / 1000}
                population={c.population}
                maxKm={maxKm}
              />
            ))}
          </div>
        </div>
      )}

      {airports.length > 0 && (
        <div>
          <Label>Nearby airports</Label>
          <div className="mt-2 flex flex-col gap-1.5">
            {airports.map((a) => (
              <div key={a.code} className="flex items-center gap-3 py-1">
                <span className="mono text-[11px] px-1.5 border border-line text-fg-1">
                  {a.code}
                </span>
                <span className="text-[12px] text-fg-0 truncate flex-1">{a.name}</span>
                <span className="mono tabular-nums text-[10px] text-fg-2">
                  {(a.distance / 1000).toFixed(1)} km
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EarthquakeDetail;

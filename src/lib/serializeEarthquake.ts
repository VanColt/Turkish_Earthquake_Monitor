import type { Earthquake as DbEarthquake } from '@/db/schema';
import type { KandilliEarthquake } from './kandilli';

export interface ApiEarthquake {
  earthquake_id: string;
  provider: string;
  title: string;
  mag: number;
  depth: number;
  geojson: { type: 'Point'; coordinates: [number, number] };
  date_time: string;
  created_at: number;
  location_tz: string | null;
  rev: string | null;
  location_properties: KandilliEarthquake['location_properties'];
}

export function serializeEarthquake(row: DbEarthquake): ApiEarthquake {
  const raw = row.raw as KandilliEarthquake;
  return {
    earthquake_id: row.earthquakeId,
    provider: row.provider,
    title: row.title,
    mag: row.mag,
    depth: row.depth,
    geojson: { type: 'Point', coordinates: [row.lng, row.lat] },
    date_time: row.dateTime,
    created_at: row.createdAt,
    location_tz: row.locationTz,
    rev: row.rev,
    location_properties: raw?.location_properties ?? {},
  };
}

const BASE = '/api';

const ENDPOINTS = {
  LIST: `${BASE}/earthquakes`,
  STATS: `${BASE}/earthquakes/stats`,
  DETAIL: (id: string) => `${BASE}/earthquakes/${id}`,
};

export interface Earthquake {
  earthquake_id: string;
  provider: string;
  title: string;
  mag: number;
  depth: number;
  geojson: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  location_properties: {
    closestCity: {
      name: string;
      cityCode: number;
      distance: number;
      population: number;
    };
    epiCenter: {
      name: string;
      cityCode: number;
      population: number | null;
    };
    closestCities: Array<{
      name: string;
      cityCode: number;
      distance: number;
      population: number;
    }>;
    airports: Array<{
      distance: number;
      name: string;
      code: string;
      coordinates: { type: string; coordinates: [number, number] };
    }>;
  };
  date_time: string;
  created_at: number;
  location_tz: string | null;
  rev: string | null;
}

export interface EarthquakeResponse {
  status: boolean;
  metadata: { date_starts: string; date_ends: string; count: number };
  result: Earthquake[];
}

export interface EarthquakeStatsResponse {
  status: boolean;
  result: {
    total: number;
    avg_magnitude: number;
    avg_depth: number;
    max_magnitude: number;
    min_magnitude: number;
    max_depth: number;
    min_depth: number;
    cities: Record<string, number>;
  };
}

export interface FilterParams {
  limit?: number;
  offset?: number;
  min_mag?: number;
  max_mag?: number;
  start_date?: string;
  end_date?: string;
  city_code?: number;
}

function toQuery(params?: Record<string, string | number | undefined | null>): string {
  if (!params) return '';
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') usp.set(k, String(v));
  }
  const s = usp.toString();
  return s ? `?${s}` : '';
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

export const fetchLiveEarthquakes = (): Promise<EarthquakeResponse> =>
  getJson(`${ENDPOINTS.LIST}${toQuery({ limit: 500 })}`);

export const fetchFilteredEarthquakes = (params: FilterParams): Promise<EarthquakeResponse> =>
  getJson(`${ENDPOINTS.LIST}${toQuery(params as Record<string, string | number | undefined | null> | undefined)}`);

export const fetchEarthquakeStats = (params?: FilterParams): Promise<EarthquakeStatsResponse> =>
  getJson(`${ENDPOINTS.STATS}${toQuery(params as Record<string, string | number | undefined | null> | undefined)}`);

export const fetchEarthquakesByCity = (
  cityCode: number,
  params?: FilterParams
): Promise<EarthquakeResponse> =>
  getJson(`${ENDPOINTS.LIST}${toQuery({ ...params, city_code: cityCode })}`);

export const fetchEarthquakeById = async (id: string): Promise<Earthquake | null> => {
  const res = await fetch(ENDPOINTS.DETAIL(id), { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { status: boolean; result: Earthquake };
  return data.result;
};

export const exportToCSV = (earthquakes: Earthquake[]): string => {
  if (!earthquakes.length) return '';
  const headers = [
    'ID',
    'Title',
    'Date',
    'Magnitude',
    'Depth',
    'Latitude',
    'Longitude',
    'Closest City',
    'Distance (km)',
  ].join(',');
  const rows = earthquakes.map((eq) => {
    const [lng, lat] = eq.geojson.coordinates;
    const distance = (eq.location_properties.closestCity.distance / 1000).toFixed(2);
    return [
      eq.earthquake_id,
      `"${eq.title.replace(/"/g, '""')}"`,
      eq.date_time,
      eq.mag.toFixed(1),
      eq.depth.toFixed(1),
      lat.toFixed(4),
      lng.toFixed(4),
      `"${eq.location_properties.closestCity.name}"`,
      distance,
    ].join(',');
  });
  return [headers, ...rows].join('\n');
};
